import { Telegraf, Context } from 'telegraf';
import { checkoutAgent } from '../mastra/agents';
import { getUserById } from '../helpers/user';
import UserBusinessRepository from '../repository/UserBusinessRepository';
import { getBusinessById } from '../helpers/business';
import CustomError from './Error';

export interface MyContext extends Context {
  currentMessageId?: number;
  currentResponse?: string;
}

const help_commands =
  `*Available Commands:*

/start \\- Start the bot  
/help \\- Show this help  
/echo \\<message\\> \\- Echo your message  
/status \\- Check bot status  
/weather \\<city\\> \\- Get weather info
`;

export default class Checkout {
  private bot: Telegraf<MyContext>;
  private readonly MAX_MESSAGE_LENGTH = 4096; // Telegram's message length limit

  constructor(token: string) {
    // Create Telegraf bot instance
    this.bot = new Telegraf<MyContext>(token);
    
    // Setup middleware and handlers
    this.setupMiddleware();
    this.setupHandlers();
    
    // Start the bot
    this.bot.launch();
    
    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }

  private setupMiddleware() {
    // Global error handler
    this.bot.catch((err: any, ctx: MyContext) => {
      console.error('Bot error occurred:', err);
      if (err instanceof CustomError) {
        const { message } = err;
        return ctx.reply(message);
      }
      return ctx.reply('Sorry, I encountered an error. Please try again.');
    });

    // Initialize context properties
    this.bot.use(async (ctx, next) => {
      ctx.currentResponse = '';
      await next();
    });
  }

  private setupHandlers() {
    // Handle /start command
    this.bot.start(async (ctx) => {
      let businessInfo;
      const payload = ctx.payload;
      if (payload) {
        try {
          businessInfo = await getBusinessById(payload);
          await UserBusinessRepository.storeUserWithBusiness(ctx.message.from, businessInfo.id, ctx, businessInfo.name);
        } catch (e) {
          throw e;
        }
      }
      const name = ctx.from.first_name || 'there';
      const message = businessInfo
        ? `Hello ${name}, welcome to *${businessInfo.name}*! 👋\nI'm here to assist you with anything you need.`
        : `Hello ${name}! 👋\nI'm your AI assistant, ready to help you with anything you need.`;
      return ctx.reply(this.escapeMarkdown(message), { parse_mode: 'MarkdownV2' });
    });

    // Handle /help command
    this.bot.help(async (ctx) => {
      return ctx.reply(help_commands, { parse_mode: 'MarkdownV2' });
    });

    // Handle text messages
    this.bot.on('text', this.handleTextMessage.bind(this));
  }

  private escapeMarkdown(text: string): string {
    // Escape special Markdown V2 characters - includes '!' which was missing
    return text.replace(/[_*[\]()~>#+=|{}.!-]/g, '\\$&');
  }

  private async handleTextMessage(ctx: MyContext) {
    const text = ctx.message.text;
    const username = ctx.from?.username || 'unknown';
    const firstName = ctx.from?.first_name || 'unknown';
    const userId = ctx.from?.id.toString();
    const { current_business_id } = await getUserById(userId);

    if (!text || text.trim().length === 0) {
      await ctx.reply('Please send a valid message.');
      return;
    }
    console.log(`Info\nchat-id: ${ctx.chat.id},text: ${text}, userId: ${userId}, username: ${username}, firstName: ${firstName}, current_business_id: ${current_business_id}`);

    try {
      // Send "thinking" message and wait for the result
      // await ctx.reply('Coming...');
      const response = await checkoutAgent.generate(text, {
        threadId: `telegram-${current_business_id}-${userId}`,
        resourceId: userId,
        context: [
          {
            role: 'system',
            content: `Current user: ${firstName} business_id:(${current_business_id}) user_id:(${userId})`,
          },
        ],
      });
      console.log("Response:\n\n\n", response)
      // Send the full response after it has been generated
      await ctx.reply(this.escapeMarkdown(response.text), { parse_mode: 'MarkdownV2' });

    } catch (error) {
      console.error('Error processing message:', error);
      await ctx.reply('Sorry, I encountered an error processing your message. Please try again.');
    }
  }

  // Utility method to stop the bot gracefully
  stop() {
    this.bot.stop();
  }
}
