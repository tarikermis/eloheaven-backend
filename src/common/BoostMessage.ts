export const enum BoostMessage {
  InvalidServer = 'invalid_server',
  TargetTierCannotBeLessThanCurrentTier = 'target_tier_cannot_be_less_than_current_tier',
  TargetDivisionCannotBeSameOrLessThanCurrentDivision = 'target_division_cannot_be_same_or_less_than_current_division',
  LPDiffMustBeGreaterThanMinDiff = 'lp_diff_must_be_greater_than_min_diff',
  RRDiffMustBeGreaterThanMinDiff = 'rr_diff_must_be_greater_than_min_diff',
  CustomChampionsOptionIsNotAvailable = 'custom_champions_option_is_not_available',
  CorruptedCustomChampionsPayload = 'corrupted_custom_champions_payload',
  DuoBoostIsNotAvailableForThisService = 'duo_boost_is_not_available_for_this_service',
  RankFilterNotFound = 'rank_filter_not_found',
  RankFilterNotFound_ByFirstLeague = 'rank_filter_not_found_by_first_league',
  RankFilterNotFound_ByLpLeague = 'rank_filter_not_found_by_lp_league',
  RankFilterNotFound_MissingDivision = 'rank_filter_not_found_missing_division',
}
