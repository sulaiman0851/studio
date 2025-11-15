import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const projects = [
  { id: 'PROJ-001', name: 'Network Upgrade - Central City', status: 'In Progress', manager: 'Alice Johnson' },
  { id: 'PROJ-002', name: 'Fiber Optic Installation - Suburbia', status: 'Completed', manager: 'Bob Williams' },
  { id: 'PROJ-003', name: 'Data Center Maintenance', status: 'On Hold', manager: 'Charlie Brown' },
  { id: 'PROJ-004', name: '5G Tower Deployment - West End', status: 'Planning', manager: 'Diana Prince' },
];

const ProjectsPage = () => {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Projects
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
          Manage and track all ongoing and completed projects.
        </p>
      </header>
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Manager</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.id}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>{project.status}</TableCell>
                <TableCell>{project.manager}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectsPage;
