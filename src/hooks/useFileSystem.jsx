import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { genId, buildTreeFromFlat } from '../lib/fileUtils';
import {
    openFile     as openFileAction,
    closeFile    as closeFileAction,
    updateContent as updateContentAction,
    toggleFolder as toggleFolderAction,
    createFile   as createFileAction,
    createFolder as createFolderAction,
    deleteNode   as deleteNodeAction,
    renameNode   as renameNodeAction,
    startRename  as startRenameAction,
    cancelRename as cancelRenameAction,
    resetTree    as resetTreeAction,
    applyGeneratedFiles as applyGeneratedFilesAction,
} from '../store/fileSystemSlice';

// Re-export INITIAL_TREE so any code that imported it from here still works
export { INITIAL_TREE } from '../store/fileSystemSlice';

// ── Pure helper — stays here so getNode works without a round-trip ────────────
function findById(node, id) {
    if (node.id === id) return node;
    for (const child of node.children ?? []) {
        const found = findById(child, id);
        if (found) return found;
    }
    return null;
}

// ── Hook — identical external API, now backed by Redux ────────────────────────
export function useFileSystem() {
    const dispatch = useDispatch();
    const { tree, openFileIds, activeFileId, renamingId } =
        useSelector(s => s.fileSystem);

    const getNode = useCallback(id => findById(tree, id), [tree]);

    const openFile = useCallback(
        id => dispatch(openFileAction(id)),
        [dispatch],
    );

    const closeFile = useCallback(
        id => dispatch(closeFileAction(id)),
        [dispatch],
    );

    const updateContent = useCallback(
        (id, content) => dispatch(updateContentAction({ id, content })),
        [dispatch],
    );

    const toggleFolder = useCallback(
        id => dispatch(toggleFolderAction(id)),
        [dispatch],
    );

    const createFile = useCallback(
        (parentId, name) => dispatch(createFileAction({ parentId, name })),
        [dispatch],
    );

    const createFolder = useCallback(
        (parentId, name) => dispatch(createFolderAction({ parentId, name })),
        [dispatch],
    );

    const deleteNode = useCallback(
        id => dispatch(deleteNodeAction(id)),
        [dispatch],
    );

    const renameNode = useCallback(
        (id, newName) => dispatch(renameNodeAction({ id, newName })),
        [dispatch],
    );

    const startRename = useCallback(
        id => dispatch(startRenameAction(id)),
        [dispatch],
    );

    const cancelRename = useCallback(
        () => dispatch(cancelRenameAction()),
        [dispatch],
    );

    const resetTree = useCallback(
        flatFiles => dispatch(resetTreeAction(flatFiles)),
        [dispatch],
    );

    const applyGeneratedFiles = useCallback(
        files => dispatch(applyGeneratedFilesAction(files)),
        [dispatch],
    );

    return {
        tree, openFileIds, activeFileId, renamingId,
        getNode, openFile, closeFile, updateContent,
        toggleFolder, createFile, createFolder,
        deleteNode, renameNode, startRename, cancelRename,
        resetTree, applyGeneratedFiles,
    };
}