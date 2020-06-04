# frozen_string_literal: true

require 'spec_helper'

RSpec.describe Geo::PackageFileRegistryFinder do
  it_behaves_like 'a framework registry finder', :package_file_registry
end
