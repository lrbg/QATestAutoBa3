import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { GitHubConfig } from './github-config.entity';
import { ExecutionsService } from '../executions/executions.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private octokit: Octokit;

  constructor(
    @InjectRepository(GitHubConfig)
    private configRepository: Repository<GitHubConfig>,
    private configService: ConfigService,
    private executionsService: ExecutionsService,
  ) {
    this.octokit = new Octokit({
      auth: this.configService.get('GITHUB_TOKEN'),
    });
  }

  async connectRepository(
    projectId: string,
    tenantId: string,
    repoOwner: string,
    repoName: string,
  ): Promise<GitHubConfig> {
    let config = await this.configRepository.findOne({ where: { projectId } });

    if (!config) {
      config = this.configRepository.create({
        projectId,
        tenantId,
        repoOwner,
        repoName,
        connected: false,
      });
    } else {
      config.repoOwner = repoOwner;
      config.repoName = repoName;
    }

    // Verify repo exists and get default branch
    try {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: repoOwner,
        repo: repoName,
      });
      config.defaultBranch = repo.default_branch;
    } catch (err) {
      this.logger.warn(`Could not verify repo ${repoOwner}/${repoName}: ${err.message}`);
      config.defaultBranch = 'main';
    }

    // Create webhook if GITHUB_TOKEN is available
    if (this.configService.get('GITHUB_TOKEN')) {
      try {
        const webhookUrl = `${this.configService.get('API_URL', 'http://localhost:3001')}/api/v1/github/webhook`;
        const { data: webhook } = await this.octokit.rest.repos.createWebhook({
          owner: repoOwner,
          repo: repoName,
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: this.configService.get('WEBHOOK_SECRET', 'webhook-secret'),
          },
          events: ['push', 'pull_request'],
          active: true,
        });
        config.webhookId = webhook.id;
      } catch (err) {
        this.logger.warn(`Could not create webhook: ${err.message}`);
      }
    }

    config.connected = true;
    config.lastSyncAt = new Date();
    return this.configRepository.save(config);
  }

  async getConfig(projectId: string): Promise<GitHubConfig | null> {
    return this.configRepository.findOne({ where: { projectId } });
  }

  async getBranches(projectId: string): Promise<string[]> {
    const config = await this.getConfig(projectId);
    if (!config) throw new NotFoundException('GitHub not connected for this project');

    try {
      const { data: branches } = await this.octokit.rest.repos.listBranches({
        owner: config.repoOwner,
        repo: config.repoName,
        per_page: 30,
      });
      return branches.map((b) => b.name);
    } catch (err) {
      this.logger.warn(`Could not fetch branches: ${err.message}`);
      return [config.defaultBranch];
    }
  }

  async handleWebhook(payload: any, tenantId: string): Promise<void> {
    const { action, ref, repository } = payload;

    if (!repository) return;

    const repoFullName = repository.full_name;
    const [owner, repo] = repoFullName.split('/');

    const config = await this.configRepository.findOne({
      where: { repoOwner: owner, repoName: repo, tenantId },
    });

    if (!config) {
      this.logger.warn(`No config found for repo ${repoFullName}`);
      return;
    }

    const branch = ref?.replace('refs/heads/', '') || 'main';
    const commitSha = payload.after || payload.pull_request?.head?.sha;

    this.logger.log(`GitHub webhook: ${action || 'push'} on ${repoFullName}/${branch}`);

    // Trigger execution for pushes to main/default branch
    if (!ref || branch === config.defaultBranch || branch === 'main') {
      await this.executionsService.create(
        { projectId: config.projectId, branch, testCaseIds: undefined },
        config.tenantId,
        'github',
      );
    }
  }
}
