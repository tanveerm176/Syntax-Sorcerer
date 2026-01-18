/**
 * SidePanel Component
 *
 * Displays the project structure tree in a side panel
 * Shows all folders expanded by default (not collapsible)
 * Always visible, displays empty state when no codebase is active
 *
 * Features:
 * - Displays full project structure tree when codebase is active
 * - All folders permanently expanded
 * - Shows file/folder icons
 * - Updates when codebase is loaded/deleted
 * - Shows empty state when no codebase
 *
 * @component
 * @returns {JSX.Element} Side panel with project tree
 */
"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "../app/styles/Chatbot.module.css";

/**
 * TreeNode component for rendering individual files/folders
 */
function TreeNode({ node, level = 0 }) {
  const isDirectory = node.type === "directory";
  const icon = isDirectory ? "📁" : "📄";

  return (
    <div>
      <div
        className={styles.treeNode}
        style={{ paddingLeft: `${level * 16}px` }}
      >
        <span className={styles.treeIcon}>{icon}</span>
        <span className={styles.treeName}>{node.name}</span>
      </div>
      {isDirectory &&
        node.children &&
        node.children.map((child) => (
          <TreeNode key={child.path} node={child} level={level + 1} />
        ))}
    </div>
  );
}

export default function SidePanel() {
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Function to fetch codebase structure
  const fetchStructure = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/structure`);

      if (!response.ok) {
        setStructure(null);
        setIsActive(false);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStructure(data.structure);
      setIsActive(true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching codebase structure:", error);
      setStructure(null);
      setIsActive(false);
      setLoading(false);
    }
  }, []);

  // Fetch structure on component mount
  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  // Listen for codebase changes
  useEffect(() => {
    const handleCodebaseChange = () => {
      fetchStructure();
    };

    window.addEventListener("codebaseDownloaded", handleCodebaseChange);
    window.addEventListener("codebaseDeleted", handleCodebaseChange);

    return () => {
      window.removeEventListener("codebaseDownloaded", handleCodebaseChange);
      window.removeEventListener("codebaseDeleted", handleCodebaseChange);
    };
  }, [fetchStructure]);

  return (
    <div className={styles.sidePanel}>
      <div className={styles.sidePanelHeader}>
        <h3 className={styles.sidePanelTitle}>Project Structure</h3>
      </div>
      <div className={styles.sidePanelContent}>
        {!isActive ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📭</div>
            <div className={styles.emptyStateText}>No codebase loaded</div>
            <div className={styles.emptyStateHint}>
              Upload a codebase to see its structure
            </div>
          </div>
        ) : loading ? (
          <div className={styles.loadingText}>Loading...</div>
        ) : structure && structure.length > 0 ? (
          <div className={styles.tree}>
            {structure.map((node) => (
              <TreeNode key={node.path} node={node} />
            ))}
          </div>
        ) : (
          <div className={styles.loadingText}>No files found</div>
        )}
      </div>
    </div>
  );
}
