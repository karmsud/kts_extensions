import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import JobsManagement from './components/JobsManagement';
import SftpJobsManagement from './components/SftpJobsManagement';
import DealsManagement from './components/DealsManagement';
import Settings from './components/Settings';
import OutlookScriptGenerator from './components/OutlookScriptGenerator';
import SftpMasterScriptGenerator from './components/SftpMasterScriptGenerator';
import './index.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<JobsManagement />} />
            <Route path="/sftp-jobs" element={<SftpJobsManagement />} />
            <Route path="/deals" element={<DealsManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/outlook-generator" element={<OutlookScriptGenerator />} />
            <Route path="/sftp-master-generator" element={<SftpMasterScriptGenerator />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
};

export default App; 