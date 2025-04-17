const apiUrl = "https://netguardai-backend.onrender.com"; // ✅ Your live backend URL

//
// Password Strength Checker
//
function checkPasswordStrength() {
  const password = document.getElementById("signup-password").value;
  const strengthBar = document.getElementById("password-strength-bar");
  const strengthText = document.getElementById("password-strength-text");

  // Default - no password
  let strength = 0;
  let status = "";

  if (!password) {
    status = "Password strength";
    strengthBar.style.width = "0%";
    strengthBar.style.background = "#334155";
  } else {
    // If password is shorter than 6 chars
    if (password.length < 6) {
      strength = 1;
      status = "Weak";
      strengthBar.style.background = "#ef4444"; // Red
    } else {
      // Start with baseline of 2 if length >= 6
      strength = 2;

      // Check for mixed case
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
        strength += 1;
      }
      // Check for numbers
      if (/\d/.test(password)) {
        strength += 1;
      }
      // Check for special characters
      if (/[^a-zA-Z0-9]/.test(password)) {
        strength += 1;
      }

      // Determine status text + color
      if (strength < 3) {
        status = "Weak";
        strengthBar.style.background = "#ef4444"; // Red
      } else if (strength < 4) {
        status = "Medium";
        strengthBar.style.background = "#f59e0b"; // Amber
      } else if (strength < 5) {
        status = "Strong";
        strengthBar.style.background = "#10b981"; // Green
      } else {
        status = "Very Strong";
        strengthBar.style.background = "#3b82f6"; // Blue
      }
    }

    // Set bar width
    const percent = (strength / 5) * 100;
    strengthBar.style.width = percent + "%";
  }

  strengthText.textContent = status;
}

//
// User Signup
//
async function signup() {
  // Grab form fields
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPasswordEl = document.getElementById("confirm-password");
  const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : "";
  const termsEl = document.getElementById("terms");
  const terms = termsEl ? termsEl.checked : false;

  // Error message container
  const errorMessage = document.getElementById("signup-error-message");
  if (errorMessage) {
    errorMessage.textContent = "";
  }

  //
  // 1. Client-side Validation
  //
  if (!name || !email || !password || (confirmPasswordEl && !confirmPassword)) {
    if (errorMessage) errorMessage.textContent = "Please fill in all fields";
    return;
  }

  // Simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (errorMessage) errorMessage.textContent = "Please enter a valid email address";
    return;
  }

  // Confirm password match
  if (confirmPasswordEl && password !== confirmPassword) {
    if (errorMessage) errorMessage.textContent = "Passwords do not match";
    return;
  }

  // Minimum length check
  if (password.length < 6) {
    if (errorMessage) errorMessage.textContent = "Password must be at least 6 characters long";
    return;
  }

  // Terms check (if present on the page)
  if (termsEl && !terms) {
    if (errorMessage) errorMessage.textContent =
      "You must agree to the Terms of Service and Privacy Policy";
    return;
  }

  //
  // 2. Send Data to Server
  //
  try {
    // Disable the signup button to prevent multiple clicks
    const signupBtn = document.querySelector(".signup-btn");
    if (signupBtn) {
      signupBtn.innerHTML = "Creating Account...";
      signupBtn.disabled = true;
    }

    // Post to /signup
    const response = await fetch(`${apiUrl}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();

    if (data.success) {
      localStorage.setItem("userId", data.userId);  // Save userId for future requests
      alert("Signup successful!");
      window.location.href = "index.html";
  }
   else {
      // Re-enable the button
      if (signupBtn) {
        signupBtn.innerHTML = "Create Account";
        signupBtn.disabled = false;
      }
      if (errorMessage) errorMessage.textContent = data.message;
    }
  } catch (err) {
    console.error("Error during signup:", err);
    if (errorMessage) errorMessage.textContent = "An error occurred while signing up.";
  }
}


// User Login
async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch(`${apiUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  const msgDiv = document.getElementById("login-message");

  if (data.success) {
    localStorage.setItem("userId", data.userId);  // Save userId for future requests
    msgDiv.textContent = "Login successful!";
    msgDiv.classList.remove("error");
    msgDiv.classList.add("show");
    window.location.href = "chatbot.html";
}
 else {
    msgDiv.textContent = data.message || "Login failed.";
    msgDiv.classList.add("error", "show");
  }
}

//
// Chatbot Logic
//

// Show thinking
function showThinkingAnimation() {
  const chatbox = document.getElementById("chatbox");
  const thinkingDiv = document.createElement("div");
  thinkingDiv.id = "thinking";
  thinkingDiv.className = "message bot";
  thinkingDiv.innerHTML = `<div class='thinking'> Thinking...</div>`;
  chatbox.appendChild(thinkingDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Remove thinking
function removeThinkingAnimation() {
  const thinkingDiv = document.getElementById("thinking");
  if (thinkingDiv) thinkingDiv.remove();
}

// Typewriter effect with advanced formatting
function typeWriterEffect(text, callback) {
  const chatbox = document.getElementById("chatbox");
  const botMessageDiv = document.createElement("div");
  botMessageDiv.className = "message bot";
  chatbox.appendChild(botMessageDiv);

  // 0) Replace "Basic Level:" & "Advanced Level:" with bold
  text = text.replace(/Basic Level:/g, "<br><strong>Basic Level:</strong><br>");
  text = text.replace(/Advanced Level:/g, "<br><strong>Advanced Level:</strong><br>");

  // 1) Convert lines like "1. Something" -> "- Something" for bullet points
  text = text.replace(/(\r?\n|^)\d+\.\s+/g, "$1- ");

  // 2) Bold text with **text** -> <strong>text</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // 3) Lines beginning with "- " -> <li>...</li>
  text = text.replace(/- (.*?)\n/g, "<li>$1</li>");

  // 4) Convert triple backticks to code box
  text = text.replace(/```([\s\S]*?)```/g, (match, p1) => {
    const commandText = p1.trim();
    return `
      <div class="code-box">
        <div class="code-header">
          bash 
          <button class="copy-btn" onclick='copyToClipboard(${JSON.stringify(commandText)})'>
            📋 Copy code
          </button>
        </div>
        <pre><code>${commandText}</code></pre>
      </div>
    `;
  });

  let index = 0;
  (function typeNextChar() {
    if (index < text.length) {
      botMessageDiv.innerHTML = text.substring(0, index + 1);
      index++;
      chatbox.scrollTop = chatbox.scrollHeight;
      setTimeout(typeNextChar, 20);
    } else if (callback) {
      callback();
    }
  })();
}

// Copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Command copied to clipboard!");
  });
}

// Retrieve or generate sessionId
let sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem("sessionId", sessionId);
}

// Send user message
function sendMessage() {
  const input = document.getElementById("user-input").value;
  const chatbox = document.getElementById("chatbox");
  const userId = localStorage.getItem("userId");  // Get userId from localStorage

  if (!input.trim()) return;

  chatbox.innerHTML += `<div class="message user">${input}</div>`;
  showThinkingAnimation();

  fetch(`${apiUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          message: input,
          userId: userId  // Send userId instead of sessionId
      })
  })
  .then((response) => response.json())
  .then((data) => {
      removeThinkingAnimation();
      typeWriterEffect(data.reply);
  })
  .catch((error) => {
      removeThinkingAnimation();
      console.error("Error:", error);
  });

  document.getElementById("user-input").value = "";
}

async function startNewChat() {
  const userId = localStorage.getItem("userId");  // Retrieve the user ID

  if (!userId) {
      alert("User not logged in. Please log in first.");
      return;
  }

  try {
      // Send request to backend to clear the conversation
      const response = await fetch(`${apiUrl}/clear-conversation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId })
      });

      const data = await response.json();

      if (data.success) {
          alert("New conversation started successfully.");
          // Clear the chatbox and show the greeting messages
          const chatbox = document.getElementById("chatbox");
          chatbox.innerHTML = `
              <div class="message bot">Hello! I'm your AI-powered network security assistant. How can I help you today?</div>
              <div class="message bot">You can ask me about configuring firewalls, VPNs, security policies, or any other network security questions for Cisco, Fortinet, F5, Juniper, or Palo Alto devices.</div>
          `;
      } else {
          alert("Failed to start a new conversation. Please try again.");
      }
  } catch (error) {
      console.error("Error starting a new conversation:", error);
  }
}

// Fetch Previous Messages
async function fetchPreviousMessages() {
  const userId = localStorage.getItem("userId");  // Get userId from localStorage

  if (!userId) return; // No user is logged in

  try {
      const response = await fetch(`${apiUrl}/get-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userId })  // Send userId to server
      });

      const data = await response.json();

      if (data.success && data.messages) {
          const chatbox = document.getElementById("chatbox");
          chatbox.innerHTML = "";  // Clear the chatbox

          // Display previous messages with typewriter effect for bots
          data.messages.forEach(message => {
              if (message.role === "assistant") {
                  typeWriterEffect(message.content);  // Show with typing effect
              } else {
                  const userMessageDiv = document.createElement("div");
                  userMessageDiv.className = "message user";
                  userMessageDiv.textContent = message.content;
                  chatbox.appendChild(userMessageDiv);
              }
          });

          chatbox.scrollTop = chatbox.scrollHeight;
      }
  } catch (error) {
      console.error("Error fetching previous messages:", error);
  }
}

// Call this function when the user logs in
window.onload = fetchPreviousMessages;


// Generate Report Function
function generateReport() {
  const userId = localStorage.getItem("userId");

  if (!userId) {
      alert("User ID not found. Please log in first.");
      return;
  }

  fetch(`${apiUrl}/generate-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userId })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          alert("Report generated and sent to your email successfully!");
      } else {
          alert("Failed to generate the report. Please try again.");
      }
  })
  .catch(error => {
      console.error("Error generating report:", error);
      alert("An error occurred while generating the report.");
  });
}

// Logout
function logout() {
  window.location.href = "index.html";
}

 // Network Animation
 document.addEventListener('DOMContentLoaded', function() {
  const canvas = document.getElementById('network-canvas');
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  class Node {
      constructor(x, y) {
          this.x = x;
          this.y = y;
          this.size = Math.random() * 3 + 2;
          this.speedX = Math.random() * 0.5 - 0.25;
          this.speedY = Math.random() * 0.5 - 0.25;
          this.color = Math.random() > 0.5 ? '#3b82f6' : '#8b5cf6';
      }
      
      update() {
          this.x += this.speedX;
          this.y += this.speedY;
          
          if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
          if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      
      draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
      }
  }
  
  const nodeCount = Math.floor(window.innerWidth / 20);
  const nodes = [];
  
  for (let i = 0; i < nodeCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      nodes.push(new Node(x, y));
  }
  
  class DataPacket {
      constructor(startNode, endNode) {
          this.startNode = startNode;
          this.endNode = endNode;
          this.x = startNode.x;
          this.y = startNode.y;
          this.progress = 0;
          this.speed = 0.01 + Math.random() * 0.02;
          this.size = 2;
          this.color = '#a78bfa';
          this.active = true;
      }
      
      update() {
          if (!this.active) return;
          
          this.progress += this.speed;
          
          if (this.progress >= 1) {
              this.active = false;
              return;
          }
          
          this.x = this.startNode.x + (this.endNode.x - this.startNode.x) * this.progress;
          this.y = this.startNode.y + (this.endNode.y - this.startNode.y) * this.progress;
      }
      
      draw() {
          if (!this.active) return;
          
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
      }
  }
  
  // Create data packets
  const packets = [];
  
  function createPacket() {
      if (nodes.length < 2) return;
      
      const startNodeIndex = Math.floor(Math.random() * nodes.length);
      let endNodeIndex;
      
      do {
          endNodeIndex = Math.floor(Math.random() * nodes.length);
      } while (endNodeIndex === startNodeIndex);
      
      packets.push(new DataPacket(nodes[startNodeIndex], nodes[endNodeIndex]));
      
      // Schedule next packet
      setTimeout(createPacket, Math.random() * 1000 + 500);
  }
  
  // Start creating packets
  createPacket();
  
  function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections between nodes
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 150) {
                  ctx.beginPath();
                  ctx.moveTo(nodes[i].x, nodes[i].y);
                  ctx.lineTo(nodes[j].x, nodes[j].y);
                  ctx.strokeStyle = '#6366f1';
                  ctx.lineWidth = 0.5 * (1 - distance / 150);
                  ctx.stroke();
              }
          }
      }
      ctx.globalAlpha = 1;
      
      // Update and draw nodes
      nodes.forEach(node => {
          node.update();
          node.draw();
      });
      
      // Update and draw packets
      packets.forEach((packet, index) => {
          packet.update();
          packet.draw();
          
          // Remove inactive packets
          if (!packet.active) {
              packets.splice(index, 1);
          }
      });
      
      requestAnimationFrame(animate);
  }
  
  animate();
});
