import {
  File, FileText, FileCode, FileJson,
  Folder, FolderOpen, ChevronRight,
  Plus, MoreVertical, Trash2, Edit2,
  X, Check, Send, Sparkles, AlertTriangle,
  FileBox, Code, Terminal, Code2, ShieldAlert,
  FilePlus, FolderPlus,
  MonitorPlay, RefreshCw, ExternalLink, Layout, Columns, AppWindow
} from 'lucide-react';

export const getFileIcon = (fileName, isFolder, isExpanded = false) => {
  if (isFolder) {
    return isExpanded ? <FolderOpen className="w-[14px] h-[14px] text-accent" /> : <Folder className="w-[14px] h-[14px] text-secondary" />;
  }
  
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'js':
    case 'jsx':
      return <FileCode className="w-[14px] h-[14px] text-warning" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="w-[14px] h-[14px] text-info" />;
    case 'json':
      return <FileJson className="w-[14px] h-[14px] text-success" />;
    case 'md':
      return <FileText className="w-[14px] h-[14px] text-secondary" />;
    case 'css':
    case 'scss':
      return <Code2 className="w-[14px] h-[14px] text-info" />;
    case 'html':
      return <Code className="w-[14px] h-[14px] text-danger" />;
    case 'sh':
      return <Terminal className="w-[14px] h-[14px] text-success" />;
    default:
      return <File className="w-[14px] h-[14px] text-muted" />;
  }
};

export const Icons = {
  File: File,
  Folder: Folder,
  FolderOpen: FolderOpen,
  ChevronRight: ChevronRight,
  Plus: Plus,
  MoreVertical: MoreVertical,
  Trash2: Trash2,
  Edit2: Edit2,
  X: X,
  Check: Check,
  Send: Send,
  Sparkles: Sparkles,
  AlertTriangle: AlertTriangle,
  FileBox: FileBox,
  Code: Code,
  Code2: Code2,
  ShieldAlert: ShieldAlert,
  FilePlus: FilePlus,
  FolderPlus: FolderPlus,
  MonitorPlay: MonitorPlay,
  RefreshCw: RefreshCw,
  ExternalLink: ExternalLink,
  Layout: Layout,
  Columns: Columns,
  AppWindow: AppWindow
};
