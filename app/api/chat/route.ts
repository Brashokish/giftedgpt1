import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Google Generative AI client
import {
  GoogleStream,
  StreamingTextResponse,
} from "ai"; // Assuming you have a Google stream implementation
import { functions, runFunction } from "./functions";

// Initialize the API key directly
const apiKey = "AIzaSyDL8lTQK78cwDfySVT_8JDbDXkgJyUcfV4"; // Your Google API key
const genAI = new GoogleGenerativeAI(apiKey); // Create a Google Generative AI client

export const runtime = "edge";

export async function POST(req: Request) {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `chathn_ratelimit_${ip}`,
    );

    if (!success) {
      return new Response("You have reached your request limit for the day.", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  const { messages } = await req.json();

  // Get the generative model
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Use the specific Gemini model
  });

  // Check if the conversation requires a function call to be made
  const initialResponse = await model.chat.completions.create({
    messages,
    stream: true,
    functions,
    function_call: "auto",
  });

  const stream = GoogleStream(initialResponse, {
    experimental_onFunctionCall: async (
      { name, arguments: args },
      createFunctionCallMessages,
    ) => {
      const result = await runFunction(name, args);
      const newMessages = createFunctionCallMessages(result);
      return model.chat.completions.create({
        stream: true,
        messages: [...messages, ...newMessages],
      });
    },
  });

  return new StreamingTextResponse(stream);
}
