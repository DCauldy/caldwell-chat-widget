import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
// Chat Widget Script
(function() {
    // --- YOUR ORIGINAL CODE (unchanged styles, setup, etc.) ---
    
    // 🔥 ADD THESE TWO FUNCTIONS for chat history
    function saveChatHistory() {
        const messages = [];
        document.querySelectorAll('.chat-message').forEach(msg => {
            messages.push({
                type: msg.classList.contains('user') ? 'user' : 'bot',
                html: msg.innerHTML
            });
        });
        localStorage.setItem('n8nChatHistory', JSON.stringify(messages));
    }

    function loadChatHistory() {
        const history = JSON.parse(localStorage.getItem('n8nChatHistory') || '[]');
        history.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.type}`;
            div.innerHTML = msg.html;
            messagesContainer.appendChild(div);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Continue your widget setup...

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'n8n-chat-widget';
    widgetContainer.style.setProperty('--n8n-chat-primary-color', config.style.primaryColor);
    widgetContainer.style.setProperty('--n8n-chat-secondary-color', config.style.secondaryColor);
    widgetContainer.style.setProperty('--n8n-chat-background-color', config.style.backgroundColor);
    widgetContainer.style.setProperty('--n8n-chat-font-color', config.style.fontColor);

    const chatContainer = document.createElement('div');
    chatContainer.className = `chat-container${config.style.position === 'left' ? ' position-left' : ''}`;

    const newConversationHTML = `...`; // your original newConversationHTML
    const chatInterfaceHTML = `...`;    // your original chatInterfaceHTML
    chatContainer.innerHTML = newConversationHTML + chatInterfaceHTML;

    const toggleButton = document.createElement('button');
    toggleButton.className = `chat-toggle${config.style.position === 'left' ? ' position-left' : ''}`;
    toggleButton.innerHTML = `...`; // your toggle SVG
    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);

    const newChatBtn = chatContainer.querySelector('.new-chat-btn');
    const chatInterface = chatContainer.querySelector('.chat-interface');
    const messagesContainer = chatContainer.querySelector('.chat-messages');
    const textarea = chatContainer.querySelector('textarea');
    const sendButton = chatContainer.querySelector('button[type="submit"]');

    // 🔥 IMMEDIATELY load chat history when widget builds
    loadChatHistory();

    async function startNewConversation() {
        currentSessionId = getSessionId();
        const data = [{
            action: "loadPreviousSession",
            sessionId: currentSessionId,
            route: config.webhook.route,
            metadata: { userId: "" }
        }];

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const responseData = await response.json();
            chatContainer.querySelector('.brand-header').style.display = 'none';
            chatContainer.querySelector('.new-conversation').style.display = 'none';
            chatInterface.classList.add('active');

            // ➡️ ADD Typing Dots while waiting
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message bot typing-indicator';
            typingDiv.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Short delay for realism
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Remove typing and show actual message
            typingDiv.remove();

            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            const responseText = Array.isArray(responseData) ? responseData[0].output : responseData.output;
            botMessageDiv.innerHTML = marked.parse(responseText);
            messagesContainer.appendChild(botMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            saveChatHistory(); // 🔥 Save after first bot message
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function sendMessage(message) {
        const messageData = {
            action: "sendMessage",
            sessionId: currentSessionId,
            route: config.webhook.route,
            chatInput: message,
            metadata: { userId: "" }
        };

        const userMessageDiv = document.createElement('div');
        userMessageDiv.className = 'chat-message user';
        userMessageDiv.textContent = message;
        messagesContainer.appendChild(userMessageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        saveChatHistory(); // 🔥 Save after sending user message

        // Typing Animation
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await fetch(config.webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            const data = await response.json();

            typingDiv.remove();

            const botMessageDiv = document.createElement('div');
            botMessageDiv.className = 'chat-message bot';
            const responseText = Array.isArray(data) ? data[0].output : data.output;
            botMessageDiv.innerHTML = marked.parse(responseText);
            messagesContainer.appendChild(botMessageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            saveChatHistory(); // 🔥 Save after receiving bot message
        } catch (error) {
            console.error('Error:', error);
            typingDiv.remove();
        }
    }

    // --- your original event listeners remain unchanged ---
    newChatBtn.addEventListener('click', startNewConversation);
    sendButton.addEventListener('click', () => {
        const message = textarea.value.trim();
        if (message) {
            sendMessage(message);
            textarea.value = '';
        }
    });
    textarea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = textarea.value.trim();
            if (message) {
                sendMessage(message);
                textarea.value = '';
            }
        }
    });
    toggleButton.addEventListener('click', () => {
        chatContainer.classList.toggle('open');
    });
    const closeButtons = chatContainer.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            chatContainer.classList.remove('open');
        });
    });
})();
