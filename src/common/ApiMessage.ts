export const enum ApiMessage {
  //Auth
  UserFound = 'user_found',
  UserNotFound = 'user_not_found',
  BoosterNotFound = 'booster_not_found',
  UsernameAlreadyExists = 'username_already_exists',
  EmailAlreadyExists = 'email_already_exists',
  RegisterSuccess = 'register_success',
  LoginSuccess = 'login_success',
  AccountBanned = 'account_banned',
  LogoutSuccess = 'logout_success',
  ResetPasswordMailSent = 'reset_password_mail_sent',
  ResetPasswordMailSentAlready = 'reset_password_mail_sent_already',
  ResetPasswordSuccess = 'reset_password_success',
  TokenGenerationFailed = 'token_generation_failed',
  AuthenticationFailure = 'authentication_failure',
  BadToken = 'bad_token',
  InvalidAccessToken = 'invalid_access_token',
  TokenIssued = 'token_issued',
  TokenExpired = 'token_expired',
  InvalidCredentials = 'invalid_credentials',
  AccessDenied = 'access_denied',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  InvalidCaptcha = 'invalid_captcha',
  DocumentVerificationRequired = 'document_verification_required',

  //Blog
  EntryDoesntExists = 'entry_doesnt_exists',
  BlogCategoryNotFound = 'blog_category_not_found',
  BlogPostCreated = 'blog_post_created',
  BlogPostNotFound = 'blog_post_not_found',
  BlogPostUpdated = 'blog_post_updated',
  BlogPostDeleted = 'blog_post_deleted',

  //General
  InternalServerError = 'internal_server_error',
  NoData = 'no_data',
  NotFound = 'not_found',
  BadRequest = 'bad_request',
  BadParams = 'bad_params',
  SomethingWrong = 'something_wrong',
  UploadSuccess = 'upload_success',
  NoFilesUploaded = 'no_files_uploaded',
  BadFileExtension = 'bad_file_extension',
  InitializationFailed = 'initialization_failed',

  // Users
  UserUpdated = 'user_updated',
  ProfileUpdated = 'profile_updated',
  PasswordUpdated = 'password_updated',
  BalanceUpdated = 'balance_updated',
  IncorrectOldPassword = 'incorrect_old_password',
  UserNotBooster = 'user_not_booster',
  SocketUnauthorized = 'socket_unauthorized',

  // Order
  OrderNotFound = 'order_not_found',
  OrderNotAvailable = 'order_not_available',
  OrderFound = 'order_found',
  OrderCreated = 'order_created',
  OrderCalculated = 'order_calculated',
  OrderUpdated = 'order_updated',
  ServiceNotFound = 'service_not_found',
  ServiceFilterNotFound = 'service_filter_not_found',
  BoosterNotAvailable = 'booster_not_available',
  ServiceNotFoundOnBoosterDetails = 'service_not_found_on_booster_details',
  NotEligibleToClaimThisLeagueOrders = 'not_eligible_to_claim_this_league_orders',
  BoosterDetailsNotConfiguredYet = 'booster_details_not_configured_yet',
  SoloOrderClaimLimitReached = 'solo_order_claim_limit_reached',
  DuoOrderClaimLimitReached = 'duo_order_claim_limit_reached',
  BoostClaimed = 'boost_claimed',
  BoostFinishedWaitForVerification = 'boost_finished_wait_for_verification',
  CoachNotFound = 'coach_not_found',
  CoachNotEligible = 'coach_not_eligible',
  OrderCredentialsNotFound = 'order_credentials_not_found',

  // Roles
  RoleUpdated = 'role_updated',
  RoleNotFound = 'role_not_found',

  // Coupons
  CouponCreated = 'coupon_created',
  CouponAlreadyExists = 'coupon_already_exists',
  CouponNotFound = 'coupon_not_found',
  CouponUpdated = 'coupon_updated',
  CouponDeleted = 'coupon_deleted',

  //Info
  CachedData = 'cached_data',
  FreshData = 'fresh_data',
  NotAvailable = 'not_available',
  Success = 'success',
  MultipleConnectionDetected = 'multiple_connection_detected',

  //Payment
  InvalidSignature = 'invalid_signature',
  HeaderNotFound = 'header_not_found',
  PaymentNotFound = 'payment_not_found',
  TransactionObjectNotFound = 'transaction_object_not_found',
  PaymentHasAlreadyBeenProcessed = 'payment_has_already_been_processed',
  SummonerNotFound = 'summoner_not_found',

  // Raffle
  RaffleCreated = 'raffle_created',
  RaffleAlreadyExists = 'raffle_already_exists',
  RaffleNotFound = 'raffle_not_found',
  RaffleUpdated = 'raffle_updated',
  RaffleDeleted = 'raffle_deleted',

  // DAK.GG & RiotApi
  RiotApi_ValorantProfileNotFound = 'RiotApi_ValorantProfileNotFound',
  RiotApi_LOLProfileNotFound = 'RiotApi_LOLProfileNotFound',

  ServiceUnderMaintenance = 'service_under_maintenance',
}
