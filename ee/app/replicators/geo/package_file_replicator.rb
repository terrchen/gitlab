# frozen_string_literal: true

module Geo
  class PackageFileReplicator < Gitlab::Geo::Replicator
    include ::Geo::BlobReplicatorStrategy
    extend ::Gitlab::Utils::Override

    def self.model
      ::Packages::PackageFile
    end

    override :verification_feature_flag_enabled?
    def self.verification_feature_flag_enabled?
      Feature.enabled?(:geo_package_file_verification, default_enabled: :yaml)
    end

    def carrierwave_uploader
      model_record.file
    end
  end
end
