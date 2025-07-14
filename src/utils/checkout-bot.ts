import { Telegraf, Context, session } from 'telegraf';
import { checkoutAgent } from '../mastra/agents';
import { getUserById } from '../helpers/user';
import UserBusinessRepository from '../repository/UserBusinessRepository';
import { getBusinessById } from '../helpers/business';
import CustomError from './Error';
import { MarkDownizeProducts, MutateCartProduct } from '../helpers/bot';
import { escapers } from "@telegraf/entity";
import CheckoutEmitter from '../Event';
import path from 'path';
import { fileURLToPath } from 'url';
import { InlineKeyboardMarkup, ReplyKeyboardMarkup, ReplyKeyboardRemove, ForceReply } from 'telegraf/typings/core/types/typegram';
import ProductRepository from '../repository/ProductRepository';
import CartRepository from '../repository/CartRepository';
import { deleteWithIndex } from '../helpers';

interface CheckoutSession {
  currentProduct?: {
    id: string;
    name: string;
    price: number;
  };
  quantity?: string;
  step?: 'idle' | 'entering_quantity' | 'confirming_order';
  quantityMessageId?: number; // Add this line
}

export interface MyContext extends Context {
  currentMessageId?: number;
  currentResponse?: string;
  session: CheckoutSession;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  private BotSendMessageState = true;

  constructor(token: string) {
    // Create Telegraf bot instance
    this.bot = new Telegraf<MyContext>(token);
    
    // Setup middleware and handlers
    this.setupMiddleware();
    this.setupHandlers();
    this.setupListeners()
    this.setupCallbacks()
    
    // Start the bot
    this.bot.launch();
    
    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
  private createInlineNumberKeyboard(): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '1', callback_data: '1' },
          { text: '2', callback_data: '2' },
          { text: '3', callback_data: '3' }
        ],
        [
          { text: '4', callback_data: '4' },
          { text: '5', callback_data: '5' },
          { text: '6', callback_data: '6' }
        ],
        [
          { text: '7', callback_data: '7' },
          { text: '8', callback_data: '8' },
          { text: '9', callback_data: '9' }
        ],
        [
          { text: '0', callback_data: '0' },
          { text: '⌫', callback_data: '⌫' },
          { text: '✅', callback_data: '✅' }
        ],
        [
          { text: 'cancel', callback_data: 'cancel' }
        ]
      ]
    };
  }

  // Sends a message to a specific chat/user via the bot
  // Usage: await this.sendMessage(chatId, "Hello, user")
  async sendMessage(chatId: number | string, message: string, data: any) {
    message = `${message}\n${data ? data.trim() : undefined}`
    await this.bot.telegram.sendMessage(
      chatId,
      // escapers.HTML(message),
      message,
      { parse_mode: 'HTML' }
    );
  }

  async sendMessageImage(chatId: number | string, message: string, data: any, image: string, reply_markup: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply | undefined = undefined) {
    message = `${message}\n${data ? data?.trim() : ``}`
    
    const imagePath = path.join(__dirname, `../../src/assets/${image}`);
    reply_markup = reply_markup || {};
    
    await this.bot.telegram.sendPhoto(
      chatId,
      { source: imagePath },
      { caption: message, parse_mode: 'HTML', reply_markup }
    );
  }

  private setupListeners() {
    CheckoutEmitter.on('sendStoreProducts', ({ user_id, message, data }) => {
      console.log("Listed product event - CALLED !!!")
      this.BotSendMessageState = false
      this.sendMessageImage(user_id, message, data, 'products.png');
    });

    CheckoutEmitter.on('foundProduct', ({ user_id, message, data, reply_markup }:{user_id: string, message: string, data: any, reply_markup: InlineKeyboardMarkup | ReplyKeyboardMarkup | ReplyKeyboardRemove | ForceReply | undefined }) => {
      console.log("Product found event - CALLED !!!")
      this.BotSendMessageState = false
      this.sendMessageImage(user_id, message, data, 'available.png', reply_markup);
    });

    CheckoutEmitter.on('readCartItems', ({user_id, message, data, reply_markup}) => {
      console.log("Cart items read event - CALLED !!!")
      this.BotSendMessageState = false
      this.sendMessageImage(user_id, message, data, 'cart.png', reply_markup);
    })
    
    CheckoutEmitter.on('removedCartItem', ({user_id, message, data, reply_markup}) => {
      console.log("Removed Cart item event - CALLED !!!")
      this.sendMessageImage(user_id, message, data, 'removed.png', reply_markup);
    })

    CheckoutEmitter.on('storeEmailPhone', ({ user_id, message, data }) => {
      console.log("Store email and phone event - CALLED !!!")
      this.BotSendMessageState = false
      this.sendMessageImage(user_id, message, data, 'available.png');
    });
  }

  private setupMiddleware() {
    // Add session middleware
    this.bot.use(session({
      defaultSession: (): CheckoutSession => ({
        step: 'idle',
        quantity: ''
      })
    }));

    // Global error handler
    this.bot.catch((err: any, ctx: MyContext) => {
      (async () => {
        console.error('Bot error occurred:', err);
        if (err instanceof CustomError) {
          const { message } = err;
          await ctx.reply(message);
        } else {
          await ctx.reply('Sorry, I encountered an error. Please try again.');
        }
      })();
    });

    // Initialize context properties
    this.bot.use(async (ctx, next) => {
      ctx.currentResponse = '';
      await next();
    });
  }

  private setupCallbacks() {
    this.bot.on('callback_query', async (ctx) => {
      const data = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
      if(!data) throw new Error('Invalid callback data!')
      if (data === 'cart_operation_cancel') {
        ctx.session.step = 'idle';
        ctx.session.currentProduct = undefined;
        ctx.session.quantity = '';
        ctx.session.quantityMessageId = undefined;
        await ctx.answerCbQuery('Cart operation canceled 😊⚡');
        await ctx.reply('Cart operation canceled. 😊⚡');
        this.BotSendMessageState = true;
        return;
      }
      if(data.startsWith('removeProductId_')) {
        const productId = data.replace('removeProductId_', '');
        const product = await ProductRepository.readOneById(productId)
        if(!product) throw new Error('Invalid Product. Not found😑');
        const userId = String(ctx.from.id)
        const { current_business_id } = await getUserById(userId);
        CartRepository.removeProductFromCart(userId, current_business_id, productId);
        CheckoutEmitter.emit('removedCartItem', { user_id: userId, message: `${product.name[0].toUpperCase()}${product.name.slice(1).toLowerCase()} removed successfully`});
      }
      if (data.startsWith('addToCart_')) {
        const productId = data.replace('addToCart_', '');
        const product = await ProductRepository.readOneById(productId);
        
        // Store in session
        ctx.session.currentProduct = {
          id: productId,
          name: product.name,
          price: product.price
        };

        
        ctx.session.step = 'entering_quantity';
        ctx.session.quantity = '';
        
        await ctx.answerCbQuery('Please enter quantity');
        const message = await ctx.reply(
          `How many ${product.name} would you like to add? (₦${product.price} each)`,
          {
            reply_markup: this.createInlineNumberKeyboard()
          }
        );

        ctx.session.quantityMessageId = message.message_id;
        this.BotSendMessageState = false;
        return;
      }
      if (data.startsWith('cartProductId_')) {
        const productId = data.replace('cartProductId_', '');
        const product = await ProductRepository.readOneById(productId);
        if (!product) return await ctx.answerCbQuery('Product not found');
        ctx.session.currentProduct = {
          id: productId,
          name: product.name,
          price: product.price
        };

        const reply_markup = {
        inline_keyboard: [
          [
            { text: "Edit Product", callback_data: `editProductId_${productId}` },
            { text: "Remove Product", callback_data: `removeProductId_${productId}` },
          ],
          [
            { text: "Cancel", callback_data: `cart_operation_cancel` },
          ],
        ],
      };

      CheckoutEmitter.emit('readCartItems', ({ user_id: ctx.from.id, message: `<b>${product.name[0].toUpperCase()}${product.name.slice(1).toLowerCase()}</b>`, data: MutateCartProduct({...ctx.session.currentProduct, quantity: ctx.session.quantity}), reply_markup }));
      this.BotSendMessageState = false;
      return await ctx.answerCbQuery(`You selected ${product.name}`);
      } 
      if (ctx.session.step === 'entering_quantity') {
        return await this.handleNumberKeyboard(ctx, data);
      }
      await ctx.answerCbQuery('Unknown option');
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
          await UserBusinessRepository.storeUserWithBusiness(ctx.message.from as any, businessInfo.id, ctx, businessInfo.name);
        } catch (e) {
          throw e;
        }
      }
      const name = ctx.from.first_name || 'there';
      const message = businessInfo
        ? `Hello ${name}, welcome to <b>${businessInfo.name}</b>! 👋\nI'm Checkout and i'll be your assistant, ready to help you with anything you need.`
        : `Hello ${name}! 👋\nI'm Checkout and i'll be your assistant, ready to help you with anything you need.`;
      return this.sendMessageImage(ctx.from.id, message, '', 'welcome.png', );
    });

    // Handle /help command
    this.bot.help(async (ctx) => {
      return this.sendMessageImage(ctx.from.id, `You can use this bot with this couple of commands. Enjoy 😊`, '', 'commands.png', );
    });

    // Handle text messages
    this.bot.on('text', this.handleTextMessage.bind(this));
  }

  private escapeMarkdown(text: string): string {
    // Escape special Markdown V2 characters - includes '!' which was missing
    return text.replace(/[_*[\]()~>#+=|{}.!-]/g, '\\$&');
  }

  private async handleTextMessage(ctx: MyContext) {
    console.log(JSON.stringify(ctx))
    const text = ctx?.text;
    const username = ctx.from?.username || 'unknown';
    const firstName = ctx.from?.first_name || 'unknown';
    const userId = ctx.from?.id.toString() || 'unknown';
    const { current_business_id } = await getUserById(userId);

    if (!text || text.trim().length === 0) {
      await ctx.reply('Please send a valid message.');
      return;
    }
    console.log("Context Mode", ctx.session.step)
    console.log(`Info\nchat-id: ${userId},text: ${text}, userId: ${userId}, username: ${username}, firstName: ${firstName}, current_business_id: ${current_business_id}`);
    
    // If user is in quantity entry mode, ignore text messages
    if (ctx.session.step === 'entering_quantity') {
      await ctx.reply('Please use the number keyboard above to enter quantity.');
      return;
    }

    try {
      const response = await checkoutAgent.generate(text, {
        threadId: `telegram-${current_business_id || 'default'}-${userId}`,
        resourceId: userId,
        context: [
          {
            role: 'system',
            content: `Current user: ${firstName} (${username}) | business_id: ${current_business_id || 'none'} | user_id: ${userId}`,
          },
        ],
      });
      
      if(this.BotSendMessageState) ctx.reply(this.escapeMarkdown(response.text), { parse_mode: 'MarkdownV2' });
      return;
    } catch (error) {
      console.error('Error processing message:', error);
      const { message } = error
      console.log("Testing Error:\n\n\n", message)
      
      if (message?.includes('contents.parts must not be empty')) {
        console.log('Clearing problematic memory thread...');
        try {
          const { message } = error;
          const index = (message.match(/contents\[(\d+)\]/) || [])[1];
          await deleteWithIndex(Number(index));
          if (this.BotSendMessageState) await ctx.reply(this.escapeMarkdown(`I didn't get that message, could you please send it again?`), { parse_mode: 'MarkdownV2' });
        } catch (err) {
          throw err
        }
      }
      throw error
    } finally {
      this.BotSendMessageState = true;
    }
  }

  private async addToCart(ctx: MyContext, product: any, quantity: number) {
    try {
      const userId = ctx.from?.id.toString() as any;
      const { current_business_id } = await getUserById(userId);

      product = { ...product, quantity };

      const store_in_cart = await CartRepository.storeOneProductInCart(userId, current_business_id, product);

      if (store_in_cart) {
        const finalText = `✅ Added ${quantity} ${product.name}(s) to cart\nTotal: ₦${quantity * product.price}`;
        
        try {
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            ctx.session.quantityMessageId,
            undefined,
            finalText
          );
        } catch (editError) {
          // If editing fails, send a new message
          await ctx.reply(finalText);
        }
      } else {
        await ctx.reply('❌ Failed to add to cart. Please try again.');
      }

      // Reset session
      ctx.session.step = 'idle';
      ctx.session.currentProduct = undefined;
      ctx.session.quantity = '';
      ctx.session.quantityMessageId = undefined;
      this.BotSendMessageState = true;

    } catch (error) {
      console.error('Error adding to cart:', error);
      await ctx.reply('❌ Error adding to cart');
      
      // Reset session on error
      ctx.session.step = 'idle';
      ctx.session.currentProduct = undefined;
      ctx.session.quantity = '';
      ctx.session.quantityMessageId = undefined;
      this.BotSendMessageState = true;
    }
  }

  private async handleNumberKeyboard(ctx: MyContext, data: string) {
  if (!ctx.session.currentProduct || !ctx.session.quantityMessageId) {
    await ctx.answerCbQuery('Something went wrong. Please try again.');
    ctx.session.step = 'idle';
    return;
  }

  try {
    switch (data) {
      case '⌫':
        // Clear/backspace
        if (ctx.session.quantity && ctx.session.quantity.length > 0) {
          ctx.session.quantity = ctx.session.quantity.slice(0, -1);
        }
        await this.updateQuantityMessage(ctx);
        await ctx.answerCbQuery('Deleted');
        break;

      case '✅':
        // Confirm and add to cart
        const quantity = parseInt(ctx.session.quantity || '0');
        if (quantity > 0) {
          await ctx.answerCbQuery('Adding to cart...');
          await this.addToCart(ctx, ctx.session.currentProduct, quantity);
        } else {
          await ctx.answerCbQuery('Please enter a valid quantity');
        }
        break;
      case 'cancel':
        // Cancel the operation
        ctx.session.step = 'idle';
        ctx.session.currentProduct = undefined;
        ctx.session.quantity = '';
        ctx.session.quantityMessageId = undefined;
        await ctx.answerCbQuery('Cart operation canceled 😊⚡');
        await ctx.reply('Cart operation canceled. 😊⚡');
        break;

      default:
        // Handle number input (0-9)
        if (/^\d$/.test(data)) {
          // Prevent leading zeros unless it's just "0"
          if (ctx.session.quantity === '0' && data !== '0') {
            ctx.session.quantity = data;
          } else if (ctx.session.quantity !== '0') {
            ctx.session.quantity = (ctx.session.quantity || '') + data;
          }
          
          await this.updateQuantityMessage(ctx);
          await ctx.answerCbQuery(data);
        } else {
          await ctx.answerCbQuery('Invalid input');
        }
    }
    // this.BotSendMessageState = true;
  } catch (error) {
    console.error('Error handling number keyboard:', error);
    await ctx.answerCbQuery('Error processing input');
  }
  }

  private async updateQuantityMessage(ctx: MyContext) {
    if (!ctx.session.currentProduct || !ctx.session.quantityMessageId) return;

    const quantity = ctx.session.quantity || '0';
    const total = parseInt(quantity) * ctx.session.currentProduct.price;
    
    const updatedText = `How many ${ctx.session.currentProduct.name} would you like to add? (₦${ctx.session.currentProduct.price} each)\n\nQuantity: ${quantity}\nTotal: ₦${total}`;
    
    try {
      await ctx.telegram.editMessageText(
        ctx.chat?.id,
        ctx.session.quantityMessageId,
        undefined,
        updatedText,
        {
          reply_markup: this.createInlineNumberKeyboard()
        }
      );
    } catch (error) {
      console.error('Error updating quantity message:', error);
    }
  }

  // Utility method to stop the bot gracefully
  stop() {
    this.bot.stop();
  }
}
