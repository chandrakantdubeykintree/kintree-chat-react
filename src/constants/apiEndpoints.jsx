export const api_auth_login_password = "/login";
export const api_auth_logout = "/logout";
export const api_auth_send_otp_login_register = "/send-otp/login-or-register";
export const api_auth_verify_otp_login_register =
  "/verify-otp/login-or-register";
export const api_auth_register_step = "/registration/step/:step";
export const api_auth_send_otp_forgot_password = "/send-otp/forgetten-password";
export const api_auth_verify_otp_forgot_password =
  "/verify-otp/forgetten-password";
export const api_auth_send_otp_forgot_username = "/send-otp/forgetten-username";
export const api_auth_verify_otp_forgot_username =
  "/verify-otp/forgetten-username";
export const api_auth_reset_password = "/reset-password";
export const api_auth_reset_username = "/reset-username";

export const api_attachments = "/attachments";
export const api_attachment = "/attachments/:attachmentId";

export const api_posts = "/posts";
export const api_post = "/posts/:postId";

export const api_polls = "/polls";
export const api_poll = "/polls/:pollId";
export const api_poll_vote = "/polls/:pollId/options/:optionId/vote";
export const api_poll_voted_users =
  "/polls/:pollId/options/:optionId/voted-users";

export const api_posts_reactions = "/posts/:postId/reactions";

export const api_posts_comments = "/posts/:postId/comments";
export const api_posts_comments_comment = "/posts/:postId/comments/:commentId";
export const api_posts_comments_reactions =
  "/posts/:postId/comments/:commentId/reactions";

export const api_events = "/events";
export const api_event = "/events/:eventId";

export const api_family_tree = "/family-tree";
export const api_family_tree_member = "/family-tree/:memberId";

export const api_family_tree_members = "/family-tree/members";
export const api_family_tree_members_member = "/family-tree/members/:memberId";

export const api_verify_user = "/send-otp/verify-user";
export const api_verify_user_otp = "/verify-otp/verify-user";

export const api_user_profile = "/user/profile";
