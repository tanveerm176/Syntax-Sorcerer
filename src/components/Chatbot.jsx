/**
 * Chatbot Component
 *
 * A client-side React component that provides the main chat interface for the application.
 * Renders a message display area and a text input field for user messages.
 * The input textarea supports multi-line input with Shift+Enter and single-line submission with Enter.
 *
 * @component
 * @returns {JSX.Element} A chat interface with messages container and input textarea
 */
"use client";
import styles from "../app/styles/Chatbot.module.css";

export default function Chatbot() {
  return (
    <div>
      {/* Chat message display area - messages are dynamically appended here */}
      <div className={styles.chatbox}>
        <div id="messages" className={styles.messages}></div>
      </div>
      {/* User input textarea - supports multi-line input with Shift+Enter, single line submit with Enter */}
      <textarea
        id="user-input"
        className={styles.userInput}
        placeholder="Type your message here..."
      ></textarea>
    </div>
  );
}
