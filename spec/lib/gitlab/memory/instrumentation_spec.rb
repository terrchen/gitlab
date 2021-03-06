# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Gitlab::Memory::Instrumentation do
  include MemoryInstrumentationHelper

  before do
    skip_memory_instrumentation!
  end

  describe '.available?' do
    it 'returns true' do
      expect(described_class).to be_available
    end
  end

  describe '.start_thread_memory_allocations' do
    subject { described_class.start_thread_memory_allocations }

    context 'when feature flag trace_memory_allocations is enabled' do
      before do
        stub_feature_flags(trace_memory_allocations: true)
      end

      it 'a hash is returned' do
        is_expected.not_to be_empty
      end
    end

    context 'when feature flag trace_memory_allocations is disabled' do
      before do
        stub_feature_flags(trace_memory_allocations: false)
      end

      it 'a nil is returned' do
        is_expected.to be_nil
      end
    end

    context 'when feature is unavailable' do
      before do
        allow(described_class).to receive(:available?) { false }
      end

      it 'a nil is returned' do
        is_expected.to be_nil
      end
    end
  end

  describe '.with_memory_allocations' do
    let(:ntimes) { 100 }

    subject do
      described_class.with_memory_allocations do
        Array.new(1000).map { '0' * 100 }
      end
    end

    before do
      expect(described_class).to receive(:start_thread_memory_allocations).and_call_original
      expect(described_class).to receive(:measure_thread_memory_allocations).and_call_original
    end

    context 'when feature flag trace_memory_allocations is enabled' do
      before do
        stub_feature_flags(trace_memory_allocations: true)
      end

      it 'a hash is returned' do
        is_expected.to include(
          mem_objects: be > 1000,
          mem_mallocs: be > 1000,
          mem_bytes: be > 100_000 # 100 items * 100 bytes each
        )
      end
    end

    context 'when feature flag trace_memory_allocations is disabled' do
      before do
        stub_feature_flags(trace_memory_allocations: false)
      end

      it 'a nil is returned' do
        is_expected.to be_nil
      end
    end

    context 'when feature is unavailable' do
      before do
        allow(described_class).to receive(:available?) { false }
      end

      it 'a nil is returned' do
        is_expected.to be_nil
      end
    end
  end
end
