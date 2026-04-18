import ProjectDetailClient from './ProjectDetailClient';

export function generateStaticParams() {
  return [{ id: 'proj-1' }, { id: 'proj-2' }, { id: 'proj-3' }];
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />;
}
