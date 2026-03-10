**We used AI for:**
- Debugging: Identifying logical errors and resolving complex stack trace.
- Improving upon existing code or ideas we already had

- Reviews of pull requests:Using Ai as secondary reviewer to catch edge cases before final approve

- Skill Improvement: Accelerating the learning curve for new language and framework

**Examples of AI tools we used:**
- ChatGPT
- Gemini
- CoPilot (for PR reviews)

All uses of AI have been thoroughly checked by the programmers to avoid any errors.

## Specifics per person

### Jeff: 

**Tools used**

- ChatGPT
- Gemini

#### Where did you use AI tools and why 

Research and architecture best practices - AI was useful for shaping the overall SharedGo structure, especially email verification login flow, session-based auth, and the chat architecture using REST plus Socket.IO. It helped compare approaches quickly and highlight tradeoffs before implementation.

Frontend - I mainly used AI for debugging React/TypeScript issues and UI fixes. and ask what tool can i use in reack. Typical use cases were navigation state between pages, useEffect behavior, socket lifecycle issues, and CSS layout problems (avatar/button alignment, responsive spacing, input behavior). It also helped with frontend best-practice checks.

Backend - I used AI to support route and data-layer work in Express + Prisma. This included endpoint validation/error handling patterns, query structure, relation includes, and session-protected route logic. It was also useful for troubleshooting backend errors and refining implementations.

Real-time chat flow - Connections. AI helped reason about event flow and safety checks for chat (thread:join, message:send, message:new), room membership verification, and how to reuse session auth across HTTP and Socket.IO. And how to connect frontend and backend smoothly

Documentation and troubleshooting - AI was used to draft and improve API docs, clarify unclear error messages, and generate candidate fixes faster for login/chat issues.

Deployment and configuration support - AI assisted with environment setup questions such as SMTP/email auth config, Prisma generate/migrate flow, Docker-related setup, and cookie/session behavior across frontend and backend.

**Examples of Prompt I input:**
- System Design: "Provide a general requirement analysis and a recommended tech stack for designing a real-time map system."

- Why my code in /search endpoint not work as I expected, what function of an array have that i can use to filter the object inside

- the endpoint need ... as input and will output ..., base on what i said, help me improve the API_readme


**Thibault:**
- Debugging: "I have come across this error ... can you pin-point the problem?"

- CSS Styling: "Provide a rough template for a .css container/input-form"


**Oliver**

**Tools used**

- Gemini
- ChatGPT


#### Where did you use AI tools and why 

Frontend - I used AI to support the development of the website for example I used it to help me integrate the leaflet map API into our project. I also use it to help with CSS if Im struggling to make something look a certain way.

Backend - I used AI to explain the backend code that had already been written and it helped me understand it. I used it to aid me in connecting the frontend to the backend.

Debugging - If I got stuck on a bug I would explain my problem to AI and see if it could find the bug.

**Examples of Prompts I used:**

- Debugging: "Its giving me this error... Can you suggest how to fix it?"

- Coding: "How can I make this button look a certain way?"

- General advice: "What is the best Map API I could use for this project"

**Soko**
- Design brainstorming: "What are the must have features", "suggest layout for ... page"

- Unit testing (Jest): "Explain this Jest error message" 

- CI/CD: "Explain why my Github action deployment failed, suggest fix for YAML configuration", "suggest fix for multi-stage build errors"

**Minzhe**
- Debugging: "Can you help me fix the error...? Please give me some advice."

- Coding: "Give me some templates to complete the specific styles."

- PR: "Help me rewrite the PR description according to the specified format."



**Quality Assurance:**
- Manual validation: Every word proposed by AI underwent a mandatory manual review by a programmer

- Must declare where you use AI inside team so team-mate can be more careful when dealing with that.
