<script>
import { PackageType } from '../../shared/constants';
import ComposerInstallation from './composer_installation.vue';
import ConanInstallation from './conan_installation.vue';
import MavenInstallation from './maven_installation.vue';
import NpmInstallation from './npm_installation.vue';
import NugetInstallation from './nuget_installation.vue';
import PypiInstallation from './pypi_installation.vue';

export default {
  name: 'InstallationCommands',
  components: {
    [PackageType.CONAN]: ConanInstallation,
    [PackageType.MAVEN]: MavenInstallation,
    [PackageType.NPM]: NpmInstallation,
    [PackageType.NUGET]: NugetInstallation,
    [PackageType.PYPI]: PypiInstallation,
    [PackageType.COMPOSER]: ComposerInstallation,
  },
  props: {
    packageEntity: {
      type: Object,
      required: true,
    },
    npmPath: {
      type: String,
      required: false,
      default: '',
    },
    npmHelpPath: {
      type: String,
      required: false,
      default: '',
    },
  },
  computed: {
    installationComponent() {
      return this.$options.components[this.packageEntity.package_type];
    },
  },
};
</script>

<template>
  <div v-if="installationComponent">
    <component
      :is="installationComponent"
      :name="packageEntity.name"
      :registry-url="npmPath"
      :help-url="npmHelpPath"
    />
  </div>
</template>
