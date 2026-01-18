/**
 * QueryControls Component
 *
 * Provides chat interface controls and message handling for the application.
 * Manages both direct ChatGPT conversations and semantic code base queries via Pinecone.
 *
 * Features:
 * - Send messages to ChatGPT (with chat history maintained in Redis)
 * - Query the codebase and retrieve relevant code snippets via Pinecone similarity search
 * - Real-time message rendering with markdown and syntax highlighting
 * - Enter key handling: Enter to send, Shift+Enter for new line
 *
 * Message flow:
 * 1. Chat mode: User input → ChatGPT API → Response rendered
 * 2. Code search mode: User input → Embedded query → Pinecone similarity search → ChatGPT context analysis → Response
 *
 * @component
 * @returns {JSX.Element} Control buttons and message management interface
 */
"use client";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "../app/styles/Chatbot.module.css";
import MarkdownRenderer from "./MarkdownRenderer";

export default function QueryControls() {
  // Counter to track message DOM IDs for dynamic markdown rendering
  const [messageCounter, setMessageCounter] = useState(0);

  useEffect(() => {
    const inputField = document.getElementById("user-input");

    const handleKeyPress = (event) => {
      // Check if Enter is pressed without Shift - submit the message
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Prevent default behavior (new line)
        sendMessage(); // Send the message
      }
      // If Shift + Enter, allow a new line
      else if (event.key === "Enter" && event.shiftKey) {
        // Allow the browser to insert a new line
        // No need to prevent default in this case
      }
    };

    inputField.addEventListener("keydown", handleKeyPress);

    // Cleanup the event listener on component unmount
    return () => {
      inputField.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  /**
   * Displays a message in the chat interface with markdown rendering
   * Creates a DOM element with sender name and content
   * Renders markdown/code in the content area using MarkdownRenderer
   * Auto-scrolls to the latest message
   *
   * @param {string} sender - The message sender ("user", "assistant", "error", etc.)
   * @param {string} message - The message content (supports markdown)
   */
  // Display a message on the frontend
  function appendMessage(sender, message) {
    const messagesDiv = document.getElementById("messages");
    const messageElement = document.createElement("div");
    messageElement.className = styles["message"];

    // Create sender label
    const senderElement = document.createElement("div");
    senderElement.textContent = sender.toUpperCase();
    senderElement.className = styles["sender"];

    // Create content container
    const contentElement = document.createElement("div");
    contentElement.className = styles["content"];

    // Assemble message structure
    messageElement.appendChild(senderElement);
    messageElement.appendChild(contentElement);
    messagesDiv.appendChild(messageElement);

    // Use counter state to ensure unique IDs for each markdown element
    setMessageCounter((prevCounter) => {
      const currentCounter = prevCounter;

      // Create unique container for this message's markdown content
      contentElement.innerHTML = `<div id="markdown-content${currentCounter}"></div>`;
      const markdownElement = document.getElementById(
        `markdown-content${currentCounter}`,
      );

      // Render markdown with syntax highlighting using React portal
      const root = createRoot(markdownElement);
      root.render(<MarkdownRenderer content={message} />);

      return currentCounter + 1;
    });

    // Auto-scroll to show the latest message
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  /**
   * Fetches a response from OpenAI ChatGPT API
   * Maintains chat history context using Redis
   * Limits conversation history to recent messages for token efficiency
   *
   * @async
   * @param {string} userInput - The user's message to send to ChatGPT
   */
  async function fetchChatGPTResponse(userInput) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: userInput }),
    });

    const botMessage = await response.json();
    if (botMessage.error) {
      appendMessage("Error", botMessage.error);
    } else {
      appendMessage("Assistant", botMessage.text);
    }
  }

  /**
   * Sends a direct message to ChatGPT and displays the response
   * Disables buttons during request to prevent duplicate submissions
   * Clears input field after sending
   *
   * @async
   */
  async function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (userInput.trim() === "") return;

    appendMessage("You", userInput);
    document.getElementById("user-input").value = "";

    const sendButton = document.getElementById("send-button");
    const queryButton = document.getElementById("query-button");
    queryButton.disabled = true;
    sendButton.disabled = true;

    await fetchChatGPTResponse(userInput);

    sendButton.disabled = false;
    queryButton.disabled = false;
  }

  /**
   * Sends relevant code snippets and user query to ChatGPT for analysis
   * Concatenates retrieved code files with the user's question
   * Provides code context for ChatGPT to answer based on actual codebase
   *
   * @async
   * @param {string[]} files - Array of code snippet strings from Pinecone search
   * @param {string} userInput - The original user query
   */
  async function sendFiles(files, userInput) {
    // Concatenate all retrieved code files
    let request = "";

    for (let i = 0; i < files.length; i++) {
      request = request.concat(files[i] + "\n");
    }

    // Add user question with context about the code
    request = request.concat(
      "I have a question about this code (if what follows does not seem like a reasonable question, prompt me to enter my question again): " +
        userInput,
    );

    // Send combined request to ChatGPT
    await fetchChatGPTResponse(request);
  }

  /**
   * Initiates a semantic search of the codebase using Pinecone
   * Embeds user query and searches for relevant code snippets
   * Displays formatted search results with match percentages
   * Disables buttons during request to prevent duplicate submissions
   *
   * @async
   */
  async function sendCodebaseQuery() {
    const userInput = document.getElementById("user-input").value;
    if (userInput.trim() === "") return;

    appendMessage("You", userInput);
    document.getElementById("user-input").value = "";

    const sendButton = document.getElementById("send-button");
    const queryButton = document.getElementById("query-button");
    queryButton.disabled = true;
    sendButton.disabled = true;

    await fetchPineconeResponse(userInput);

    sendButton.disabled = false;
    queryButton.disabled = false;
  }

  /**
   * Queries Pinecone vector database for semantically similar code snippets
   * Embeds the user query using OpenAI's embedding model
   * Returns most relevant code chunks with match percentages
   * Displays formatted list of results without ChatGPT analysis
   *
   * @async
   * @param {string} userInput - The user's query to search the codebase with
   */
  async function fetchPineconeResponse(userInput) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/database`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: userInput }),
    });

    const botMessage = await response.json();
    if (botMessage.error) {
      appendMessage("Error", botMessage.error);
    } else {
      // Display the search results list with match percentages
      appendMessage("Search Results", botMessage.text);
    }
  }

  // Button controls for sending messages and querying the codebase
  return (
    <div className={styles.flex}>
      {/* Button to send direct message to ChatGPT */}
      <button
        id="send-button"
        className={styles.submitButton}
        onClick={sendMessage}
      >
        Ask Chatbot
      </button>
      {/* Button to perform semantic search of the codebase via Pinecone */}
      <button
        id="query-button"
        className={styles.submitButton}
        onClick={sendCodebaseQuery}
      >
        Search codebase
      </button>
    </div>
  );
}
