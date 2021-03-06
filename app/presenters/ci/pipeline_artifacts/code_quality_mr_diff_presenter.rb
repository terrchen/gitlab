# frozen_string_literal: true

module Ci
  module PipelineArtifacts
    class CodeQualityMrDiffPresenter < Gitlab::View::Presenter::Delegated
      include Gitlab::Utils::StrongMemoize

      def for_files(filenames)
        quality_files = raw_report["files"].select { |key| filenames.include?(key) }

        { files: quality_files }
      end

      private

      def raw_report
        strong_memoize(:raw_report) do
          self.each_blob do |blob|
            Gitlab::Json.parse(blob).with_indifferent_access
          end
        end
      end
    end
  end
end
