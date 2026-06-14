/**
 * Point d'entrée des modèles. Importer depuis ici garantit que tous les
 * schémas sont enregistrés auprès de Mongoose (utile pour les `.populate()`
 * de refs croisées) :
 *
 *   import { Product, Order } from "@/lib/models";
 */
export { Settings, type SettingsDoc } from "./Settings";
export { Category, type CategoryDoc } from "./Category";
export { Product, type ProductDoc } from "./Product";
export { Review, type ReviewDoc } from "./Review";
export { Customer, type CustomerDoc } from "./Customer";
export { Order, type OrderDoc } from "./Order";
export { PromoCode, type PromoCodeDoc } from "./PromoCode";
export { Cart, type CartDoc } from "./Cart";
export { ChatConversation, type ChatConversationDoc } from "./ChatConversation";
export { AdminUser, type AdminUserDoc } from "./AdminUser";
export { NewsletterSubscriber, type NewsletterSubscriberDoc } from "./NewsletterSubscriber";
export { ContactMessage, type ContactMessageDoc } from "./ContactMessage";
