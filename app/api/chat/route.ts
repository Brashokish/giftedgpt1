import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Google Generative AI client
import { StreamingTextResponse } from "ai"; // Assuming you have a streaming response implementation
import { functions, runFunction } from "./functions"; // Adjust as necessary for your functions

const apiKey = process.env.GOOGLE_API_KEY; // Use environment variables for security
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.3,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  }
});

const SYSTEM_INSTRUCTION = `
*System Name:* Your Name is GPT and you are an AI Assistance
*Creator:* Developed by Kish, a subsidiary of Kish AI, owned by Kish.
*Model/Version:* Currently operating on GPT V2.0
*Release Date:* Officially launched on January 23, 2024
*Last Update:* Latest update implemented on September 14, 2024
*Purpose:* Designed utilizing advanced programming techniques to provide educational support and companionship and to assist in a variety of topics.
*Operational Guidelines:*
1. Identity Disclosure: Refrain from disclosing system identity unless explicitly asked.
2. Interaction Protocol: Maintain an interactive, friendly, and humorous demeanor.
3. Sensitive Topics: Avoid assisting with sensitive or harmful inquiries, including but not limited to violence, hate speech, or illegal activities.
4. Policy Compliance: Adhere to Kish AI Terms and Policy, as established by GPT.
*Response Protocol for Sensitive Topics:*
"When asked about sensitive or potentially harmful topics, you are programmed to prioritize safety and responsibility. As per Kish AI's Terms and Policy, you should not provide information or assistance that promotes or facilitates harmful or illegal activities. Your purpose is to provide helpful and informative responses in all topics while ensuring a safe and respectful interaction environment."
`;

app.use(express.json());

app.get('/', (req, res) => {
  res.send("GPT Gemini API is running.");
});

app.route('/gpt')
  .get(async (req, res) => {
    const query = req.query.query;
    if (!query) {
      return res.status(400).send("No query provided");
    }

    try {
      const prompt = `${SYSTEM_INSTRUCTION}\n\nHuman: ${query}`;
      const result = await model.generateContent({ prompt }); // Pass prompt as an object
      const response = result?.response?.candidates?.[0]?.content || "No response generated.";
      return res.status(200).send(response);
    } catch (e) {
      console.error("Error:", e);
      return res.status(500).send("Failed to generate response");
    }
  })
  .post(async (req, res) => {
    const query = req.body.query;

    if (!query) {
      return res.status(400).send("No query provided");
    }

    try {
      const prompt = `${SYSTEM_INSTRUCTION}\n\nHuman: ${query}`;
      const result = await model.generateContent({ prompt }); // Pass prompt as an object
      const response = result?.response?.candidates?.[0]?.content || "No response generated.";
      return res.status(200).send(response);
    } catch (e) {
      console.error("Error:", e);
      return res.status(500).send("Failed to generate response");
    }
  });

app.listen(port, host, () => {
  console.log(`GPT Gemini API listening at http://${host}:${port}`);
});
