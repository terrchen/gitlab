# frozen_string_literal: true
module QA
  module EE
    module Runtime
      module Saml
        def self.idp_base_url
          host = QA::Runtime::Env.simple_saml_hostname || 'localhost'
          "https://#{host}:8443/simplesaml/saml2/idp"
        end

        def self.idp_sso_url
          "#{idp_base_url}/SSOService.php"
        end

        def self.idp_metadata_url
          "#{idp_base_url}/metadata.php"
        end

        def self.idp_issuer
          idp_metadata_url
        end

        def self.idp_certificate_fingerprint
          QA::Runtime::Env.simple_saml_fingerprint || '119b9e027959cdb7c662cfd075d9e2ef384e445f'
        end
      end
    end
  end
end
