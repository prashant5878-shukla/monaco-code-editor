import { TreeNode } from './TreeNode';

export function TreeView({
  tree, activeFileId, renamingId,
  onOpen, onToggle, onCreate, onDelete, onStartRename, onRename, onCancelRename,
}) {
  return (
    <div className="pb-2">
      {(tree.children ?? []).map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          activeFileId={activeFileId}
          renamingId={renamingId}
          onOpen={onOpen}
          onToggle={onToggle}
          onCreate={onCreate}
          onDelete={onDelete}
          onStartRename={onStartRename}
          onRename={onRename}
          onCancelRename={onCancelRename}
        />
      ))}
    </div>
  );
}