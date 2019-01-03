import { s__ } from '~/locale';

export default () => ({
  isLoadingVulnerabilities: true,
  errorLoadingVulnerabilities: false,
  vulnerabilities: [],
  isLoadingVulnerabilitiesCount: true,
  errorLoadingVulnerabilitiesCount: false,
  vulnerabilitiesCount: {},
  isLoadingVulnerabilitiesHistory: true,
  errorLoadingVulnerabilitiesHistory: false,
  vulnerabilitiesHistory: {},
  pageInfo: {},
  vulnerabilitiesCountEndpoint: null,
  vulnerabilitiesHistoryEndpoint: null,
  vulnerabilitiesEndpoint: null,
  activeVulnerability: null,
  modal: {
    data: {
      description: { text: s__('Vulnerability|Description') },
      project: {
        text: s__('Vulnerability|Project'),
        isLink: true,
      },
      file: { text: s__('Vulnerability|File') },
      identifiers: { text: s__('Vulnerability|Identifiers') },
      severity: { text: s__('Vulnerability|Severity') },
      confidence: { text: s__('Vulnerability|Confidence') },
      className: { text: s__('Vulnerability|Class') },
      links: { text: s__('Vulnerability|Links') },
      instances: { text: s__('Vulnerability|Instances') },
    },
    vulnerability: {},
    isCreatingNewIssue: false,
    isDismissingVulnerability: false,
  },
  isCreatingIssue: false,
  isDismissingVulnerability: false,
});
