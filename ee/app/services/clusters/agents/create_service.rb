# frozen_string_literal: true

module Clusters
  module Agents
    class CreateService < BaseService
      def execute(name:)
        return error_rollout_gitlab_com unless included_in_gitlab_com_rollout?
        return error_not_premium_plan unless project.feature_available?(:cluster_agents)
        return error_no_permissions unless cluster_agent_permissions?

        agent = ::Clusters::Agent.new(name: name, project: project, created_by_user: current_user)

        if agent.save
          success.merge(cluster_agent: agent)
        else
          error(agent.errors.full_messages)
        end
      end

      private

      def included_in_gitlab_com_rollout?
        Gitlab::Kas.included_in_gitlab_com_rollout?(project)
      end

      def error_rollout_gitlab_com
        error(s_('ClusterAgent|This project is not included in the GitLab.com rollout for Kubernetes agent'))
      end

      def cluster_agent_permissions?
        current_user.can?(:admin_pipeline, project) && current_user.can?(:create_cluster, project)
      end

      def error_no_permissions
        error(s_('ClusterAgent|You have insufficient permissions to create a cluster agent for this project'))
      end

      def error_not_premium_plan
        error(s_('ClusterAgent|This feature is only available for premium plans'))
      end
    end
  end
end
