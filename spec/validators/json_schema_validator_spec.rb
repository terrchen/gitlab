# frozen_string_literal: true

require 'spec_helper'

RSpec.describe JsonSchemaValidator do
  describe '#validates_each' do
    let(:build_report_result) { build(:ci_build_report_result, :with_junit_success) }

    subject { validator.validate(build_report_result) }

    context 'when filename is set' do
      let(:validator) { described_class.new(attributes: [:data], filename: "build_report_result_data") }

      context 'when data is valid' do
        it 'returns no errors' do
          subject

          expect(build_report_result.errors).to be_empty
        end
      end

      context 'when data is invalid' do
        it 'returns json schema is invalid' do
          build_report_result.data = { invalid: 'data' }

          validator.validate(build_report_result)

          expect(build_report_result.errors.size).to eq(1)
          expect(build_report_result.errors.full_messages).to eq(["Data must be a valid json schema"])
        end
      end

      context 'when draft is > 4' do
        let(:validator) { described_class.new(attributes: [:data], filename: "build_report_result_data", draft: 6) }

        it 'uses JSONSchemer to perform validations' do
          expect(JSONSchemer).to receive(:schema).with(Pathname.new(Rails.root.join('app', 'validators', 'json_schemas', 'build_report_result_data.json').to_s)).and_call_original

          subject
        end
      end

      context 'when draft is <= 4' do
        let(:validator) { described_class.new(attributes: [:data], filename: "build_report_result_data", draft: 4) }

        it 'uses JSON::Validator to perform validations' do
          expect(JSON::Validator).to receive(:validate).with(Rails.root.join('app', 'validators', 'json_schemas', 'build_report_result_data.json').to_s, build_report_result.data)

          subject
        end
      end

      context 'when draft value is not provided' do
        let(:validator) { described_class.new(attributes: [:data], filename: "build_report_result_data") }

        it 'uses JSON::Validator to perform validations' do
          expect(JSON::Validator).to receive(:validate).with(Rails.root.join('app', 'validators', 'json_schemas', 'build_report_result_data.json').to_s, build_report_result.data)

          subject
        end
      end
    end

    context 'when filename is not set' do
      let(:validator) { described_class.new(attributes: [:data]) }

      it 'raises an ArgumentError' do
        expect { subject }.to raise_error(ArgumentError)
      end
    end

    context 'when filename is invalid' do
      let(:validator) { described_class.new(attributes: [:data], filename: "invalid$filename") }

      it 'raises a FilenameError' do
        expect { subject }.to raise_error(described_class::FilenameError)
      end
    end
  end
end
