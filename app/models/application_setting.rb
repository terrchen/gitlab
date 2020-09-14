# frozen_string_literal: true

class ApplicationSetting < ApplicationRecord
  include CacheableAttributes
  include CacheMarkdownField
  include TokenAuthenticatable
  include ChronicDurationAttribute
  include IgnorableColumns

  ignore_column :namespace_storage_size_limit, remove_with: '13.5', remove_after: '2020-09-22'
  ignore_column :instance_statistics_visibility_private, remove_with: '13.6', remove_after: '2020-10-22'
  ignore_column :snowplow_iglu_registry_url, remove_with: '13.6', remove_after: '2020-11-22'

  GRAFANA_URL_ERROR_MESSAGE = 'Please check your Grafana URL setting in ' \
    'Admin Area > Settings > Metrics and profiling > Metrics - Grafana'

  add_authentication_token_field :runners_registration_token, encrypted: -> { Feature.enabled?(:application_settings_tokens_optional_encryption) ? :optional : :required }
  add_authentication_token_field :health_check_access_token
  add_authentication_token_field :static_objects_external_storage_auth_token

  belongs_to :self_monitoring_project, class_name: "Project", foreign_key: 'instance_administration_project_id'
  belongs_to :push_rule
  alias_attribute :self_monitoring_project_id, :instance_administration_project_id

  belongs_to :instance_group, class_name: "Group", foreign_key: 'instance_administrators_group_id'
  alias_attribute :instance_group_id, :instance_administrators_group_id
  alias_attribute :instance_administrators_group, :instance_group

  def self.repository_storages_weighted_attributes
    @repository_storages_weighted_atributes ||= Gitlab.config.repositories.storages.keys.map { |k| "repository_storages_weighted_#{k}".to_sym }.freeze
  end

  store_accessor :repository_storages_weighted, *Gitlab.config.repositories.storages.keys, prefix: true

  # Include here so it can override methods from
  # `add_authentication_token_field`
  # We don't prepend for now because otherwise we'll need to
  # fix a lot of tests using allow_any_instance_of
  include ApplicationSettingImplementation

  serialize :restricted_visibility_levels # rubocop:disable Cop/ActiveRecordSerialize
  serialize :import_sources # rubocop:disable Cop/ActiveRecordSerialize
  serialize :disabled_oauth_sign_in_sources, Array # rubocop:disable Cop/ActiveRecordSerialize
  serialize :domain_whitelist, Array # rubocop:disable Cop/ActiveRecordSerialize
  serialize :domain_blacklist, Array # rubocop:disable Cop/ActiveRecordSerialize
  serialize :repository_storages # rubocop:disable Cop/ActiveRecordSerialize
  serialize :asset_proxy_whitelist, Array # rubocop:disable Cop/ActiveRecordSerialize

  cache_markdown_field :sign_in_text
  cache_markdown_field :help_page_text
  cache_markdown_field :shared_runners_text, pipeline: :plain_markdown
  cache_markdown_field :after_sign_up_text

  default_value_for :id, 1
  default_value_for :repository_storages_weighted, {}

  chronic_duration_attr_writer :archive_builds_in_human_readable, :archive_builds_in_seconds

  validates :grafana_url,
            system_hook_url: {
              blocked_message: "is blocked: %{exception_message}. " + GRAFANA_URL_ERROR_MESSAGE
            },
            if: :grafana_url_absolute?

  validate :validate_grafana_url

  validates :uuid, presence: true

  validates :outbound_local_requests_whitelist,
            length: { maximum: 1_000, message: N_('is too long (maximum is 1000 entries)') },
            allow_nil: false,
            qualified_domain_array: true

  validates :session_expire_delay,
            presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :minimum_password_length,
            presence: true,
            numericality: { only_integer: true,
                            greater_than_or_equal_to: DEFAULT_MINIMUM_PASSWORD_LENGTH,
                            less_than_or_equal_to: Devise.password_length.max }

  validates :home_page_url,
            allow_blank: true,
            addressable_url: true,
            if: :home_page_url_column_exists?

  validates :help_page_support_url,
            allow_blank: true,
            addressable_url: true,
            if: :help_page_support_url_column_exists?

  validates :after_sign_out_path,
            allow_blank: true,
            addressable_url: true

  validates :admin_notification_email,
            devise_email: true,
            allow_blank: true

  validates :two_factor_grace_period,
            numericality: { greater_than_or_equal_to: 0 }

  validates :recaptcha_site_key,
            presence: true,
            if: :recaptcha_or_login_protection_enabled

  validates :recaptcha_private_key,
            presence: true,
            if: :recaptcha_or_login_protection_enabled

  validates :akismet_api_key,
            presence: true,
            if: :akismet_enabled

  validates :unique_ips_limit_per_user,
            numericality: { greater_than_or_equal_to: 1 },
            presence: true,
            if: :unique_ips_limit_enabled

  validates :unique_ips_limit_time_window,
            numericality: { greater_than_or_equal_to: 0 },
            presence: true,
            if: :unique_ips_limit_enabled

  validates :plantuml_url,
            presence: true,
            if: :plantuml_enabled

  validates :sourcegraph_url,
            presence: true,
            if: :sourcegraph_enabled

  validates :snowplow_collector_hostname,
            presence: true,
            hostname: true,
            if: :snowplow_enabled

  validates :max_attachment_size,
            presence: true,
            numericality: { only_integer: true, greater_than: 0 }

  validates :max_artifacts_size,
            presence: true,
            numericality: { only_integer: true, greater_than: 0 }

  validates :max_import_size,
            presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :max_pages_size,
            presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 0,
                            less_than: ::Gitlab::Pages::MAX_SIZE / 1.megabyte }

  validates :default_artifacts_expire_in, presence: true, duration: true

  validates :container_expiration_policies_enable_historic_entries,
            inclusion: { in: [true, false], message: 'must be a boolean value' }

  validates :container_registry_token_expire_delay,
            presence: true,
            numericality: { only_integer: true, greater_than: 0 }

  validates :repository_storages, presence: true
  validate :check_repository_storages
  validate :check_repository_storages_weighted

  validates :auto_devops_domain,
            allow_blank: true,
            hostname: { allow_numeric_hostname: true, require_valid_tld: true },
            if: :auto_devops_enabled?

  validates :enabled_git_access_protocol,
            inclusion: { in: %w(ssh http), allow_blank: true }

  validates :domain_blacklist,
            presence: { message: 'Domain blacklist cannot be empty if Blacklist is enabled.' },
            if: :domain_blacklist_enabled?

  validates :housekeeping_incremental_repack_period,
            presence: true,
            numericality: { only_integer: true, greater_than: 0 }

  validates :housekeeping_full_repack_period,
            presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: :housekeeping_incremental_repack_period }

  validates :housekeeping_gc_period,
            presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: :housekeeping_full_repack_period }

  validates :terminal_max_session_time,
            presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :polling_interval_multiplier,
            presence: true,
            numericality: { greater_than_or_equal_to: 0 }

  validates :gitaly_timeout_default,
            presence: true,
            if: :gitaly_timeout_default_changed?,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: Settings.gitlab.max_request_duration_seconds
            }

  validates :gitaly_timeout_medium,
            presence: true,
            if: :gitaly_timeout_medium_changed?,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :gitaly_timeout_medium,
            numericality: { less_than_or_equal_to: :gitaly_timeout_default },
            if: :gitaly_timeout_default
  validates :gitaly_timeout_medium,
            numericality: { greater_than_or_equal_to: :gitaly_timeout_fast },
            if: :gitaly_timeout_fast

  validates :gitaly_timeout_fast,
            presence: true,
            if: :gitaly_timeout_fast_changed?,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :gitaly_timeout_fast,
            numericality: { less_than_or_equal_to: :gitaly_timeout_default },
            if: :gitaly_timeout_default

  validates :diff_max_patch_bytes,
            presence: true,
            numericality: { only_integer: true,
                            greater_than_or_equal_to: Gitlab::Git::Diff::DEFAULT_MAX_PATCH_BYTES,
                            less_than_or_equal_to: Gitlab::Git::Diff::MAX_PATCH_BYTES_UPPER_BOUND }

  validates :user_default_internal_regex, js_regex: true, allow_nil: true

  validates :commit_email_hostname, format: { with: /\A[^@]+\z/ }

  validates :archive_builds_in_seconds,
            allow_nil: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 1.day.seconds }

  validates :local_markdown_version,
            allow_nil: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than: 65536 }

  validates :asset_proxy_url,
            presence: true,
            allow_blank: false,
            url: true,
            if: :asset_proxy_enabled?

  validates :asset_proxy_secret_key,
            presence: true,
            allow_blank: false,
            if: :asset_proxy_enabled?

  validates :static_objects_external_storage_url,
            addressable_url: true, allow_blank: true

  validates :static_objects_external_storage_auth_token,
            presence: true,
            if: :static_objects_external_storage_url?

  validates :protected_paths,
            length: { maximum: 100, message: N_('is too long (maximum is 100 entries)') },
            allow_nil: false

  validates :push_event_hooks_limit,
            numericality: { greater_than_or_equal_to: 0 }

  validates :push_event_activities_limit,
            numericality: { greater_than_or_equal_to: 0 }

  validates :snippet_size_limit, numericality: { only_integer: true, greater_than: 0 }
  validates :wiki_page_max_content_bytes, numericality: { only_integer: true, greater_than_or_equal_to: 1.kilobytes }

  validates :email_restrictions, untrusted_regexp: true

  validates :hashed_storage_enabled, inclusion: { in: [true], message: _("Hashed storage can't be disabled anymore for new projects") }

  validates :container_registry_delete_tags_service_timeout,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  SUPPORTED_KEY_TYPES.each do |type|
    validates :"#{type}_key_restriction", presence: true, key_restriction: { type: type }
  end

  validates :allowed_key_types, presence: true

  validates_each :restricted_visibility_levels do |record, attr, value|
    value&.each do |level|
      unless Gitlab::VisibilityLevel.options.value?(level)
        record.errors.add(attr, _("'%{level}' is not a valid visibility level") % { level: level })
      end
    end
  end

  validates_each :import_sources do |record, attr, value|
    value&.each do |source|
      unless Gitlab::ImportSources.options.value?(source)
        record.errors.add(attr, _("'%{source}' is not a import source") % { source: source })
      end
    end
  end

  validate :terms_exist, if: :enforce_terms?

  validates :external_authorization_service_default_label,
            presence: true,
            if: :external_authorization_service_enabled

  validates :external_authorization_service_url,
            addressable_url: true, allow_blank: true,
            if: :external_authorization_service_enabled

  validates :external_authorization_service_timeout,
            numericality: { greater_than: 0, less_than_or_equal_to: 10 },
            if: :external_authorization_service_enabled

  validates :spam_check_endpoint_url,
            addressable_url: true, allow_blank: true

  validates :spam_check_endpoint_url,
            presence: true,
            if: :spam_check_endpoint_enabled

  validates :external_auth_client_key,
            presence: true,
            if: -> (setting) { setting.external_auth_client_cert.present? }

  validates :lets_encrypt_notification_email,
            devise_email: true,
            format: { without: /@example\.(com|org|net)\z/,
                      message: N_("Let's Encrypt does not accept emails on example.com") },
            allow_blank: true

  validates :lets_encrypt_notification_email,
            presence: true,
            if: :lets_encrypt_terms_of_service_accepted?

  validates :eks_integration_enabled,
            inclusion: { in: [true, false] }

  validates :eks_account_id,
            format: { with: Gitlab::Regex.aws_account_id_regex,
                      message: Gitlab::Regex.aws_account_id_message },
            if: :eks_integration_enabled?

  validates :eks_access_key_id,
            length: { in: 16..128 },
            if: :eks_integration_enabled?

  validates :eks_secret_access_key,
            presence: true,
            if: :eks_integration_enabled?

  validates_with X509CertificateCredentialsValidator,
                 certificate: :external_auth_client_cert,
                 pkey: :external_auth_client_key,
                 pass: :external_auth_client_key_pass,
                 if: -> (setting) { setting.external_auth_client_cert.present? }

  validates :default_ci_config_path,
    format: { without: %r{(\.{2}|\A/)},
              message: N_('cannot include leading slash or directory traversal.') },
    length: { maximum: 255 },
    allow_blank: true

  validates :issues_create_limit,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :raw_blob_request_limit,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  attr_encrypted :asset_proxy_secret_key,
                 mode: :per_attribute_iv,
                 key: Settings.attr_encrypted_db_key_base_truncated,
                 algorithm: 'aes-256-cbc',
                 insecure_mode: true

  private_class_method def self.encryption_options_base_truncated_aes_256_gcm
    {
      mode: :per_attribute_iv,
      key: Settings.attr_encrypted_db_key_base_truncated,
      algorithm: 'aes-256-gcm',
      encode: true
    }
  end

  attr_encrypted :external_auth_client_key, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :external_auth_client_key_pass, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :lets_encrypt_private_key, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :eks_secret_access_key, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :akismet_api_key, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :elasticsearch_aws_secret_access_key, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :recaptcha_private_key, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :recaptcha_site_key, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :slack_app_secret, encryption_options_base_truncated_aes_256_gcm
  attr_encrypted :slack_app_verification_token, encryption_options_base_truncated_aes_256_gcm

  before_validation :ensure_uuid!

  before_save :ensure_runners_registration_token
  before_save :ensure_health_check_access_token

  after_commit do
    reset_memoized_terms
  end
  after_commit :expire_performance_bar_allowed_user_ids_cache, if: -> { previous_changes.key?('performance_bar_allowed_group_id') }

  def validate_grafana_url
    unless parsed_grafana_url
      self.errors.add(
        :grafana_url,
        "must be a valid relative or absolute URL. #{GRAFANA_URL_ERROR_MESSAGE}"
      )
    end
  end

  def grafana_url_absolute?
    parsed_grafana_url&.absolute?
  end

  def sourcegraph_url_is_com?
    !!(sourcegraph_url =~ /\Ahttps:\/\/(www\.)?sourcegraph\.com/)
  end

  def self.create_from_defaults
    check_schema!

    transaction(requires_new: true) do
      super
    end
  rescue ActiveRecord::RecordNotUnique
    # We already have an ApplicationSetting record, so just return it.
    current_without_cache
  end

  # Due to the frequency with which settings are accessed, it is
  # likely that during a backup restore a running GitLab process
  # will insert a new `application_settings` row before the
  # constraints have been added to the table. This would add an
  # extra row with ID 1 and prevent the primary key constraint from
  # being added, which made ActiveRecord throw a
  # IrreversibleOrderError anytime the settings were accessed
  # (https://gitlab.com/gitlab-org/gitlab/-/issues/36405).  To
  # prevent this from happening, we do a sanity check that the
  # primary key constraint is present before inserting a new entry.
  def self.check_schema!
    return if ActiveRecord::Base.connection.primary_key(self.table_name).present?

    raise "The `#{self.table_name}` table is missing a primary key constraint in the database schema"
  end

  # By default, the backend is Rails.cache, which uses
  # ActiveSupport::Cache::RedisStore. Since loading ApplicationSetting
  # can cause a significant amount of load on Redis, let's cache it in
  # memory.
  def self.cache_backend
    Gitlab::ProcessMemoryCache.cache_backend
  end

  def recaptcha_or_login_protection_enabled
    recaptcha_enabled || login_recaptcha_protection_enabled
  end

  repository_storages_weighted_attributes.each do |attribute|
    define_method :"#{attribute}=" do |value|
      super(value.to_i)
    end
  end

  private

  def parsed_grafana_url
    @parsed_grafana_url ||= Gitlab::Utils.parse_url(grafana_url)
  end
end

ApplicationSetting.prepend_if_ee('EE::ApplicationSetting')
