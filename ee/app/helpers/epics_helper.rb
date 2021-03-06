# frozen_string_literal: true

module EpicsHelper
  def epic_initial_data(epic)
    issuable_initial_data(epic).merge(canCreate: can?(current_user, :create_epic, epic.group))
  end

  def epic_show_app_data(epic)
    EpicPresenter.new(epic, current_user: current_user).show_data(author_icon: avatar_icon_for_user(epic.author), base_data: epic_initial_data(epic))
  end

  def epic_new_app_data(group)
    {
      group_path: group.full_path,
      group_epics_path: group_epics_path(group),
      labels_fetch_path: group_labels_path(group, format: :json, only_group_labels: true, include_ancestor_groups: true),
      labels_manage_path: group_labels_path(group),
      markdown_preview_path: preview_markdown_path(group),
      markdown_docs_path: help_page_path('user/markdown')
    }
  end

  def epic_endpoint_query_params(opts)
    opts[:data] ||= {}
    opts[:data][:endpoint_query_params] = {
      only_group_labels: true,
      include_ancestor_groups: true,
      include_descendant_groups: true
    }.to_json

    opts
  end

  def epic_state_dropdown_link(state, selected_state)
    link_to epic_state_title(state), page_filter_path(state: state), class: state == selected_state ? 'is-active' : ''
  end

  def epic_state_title(state)
    titles = {
      "opened" => "Open"
    }

    _("%{state} epics") % { state: (titles[state.to_s] || state.to_s.humanize) }
  end

  def epic_timeframe(epic)
    short_format = '%b %d'
    long_format = '%b %d, %Y'

    if epic.start_date.present? && epic.end_date.present?
      start_date_format = epic.start_date.year == epic.end_date.year ? short_format : long_format

      "#{epic.start_date.strftime(start_date_format)} – #{epic.end_date.strftime(long_format)}"
    elsif epic.start_date.present?
      s_('GroupRoadmap|%{dateWord} – No end date') % { dateWord: epic.start_date.strftime(long_format) }
    elsif epic.end_date.present?
      s_("GroupRoadmap|No start date – %{dateWord}") % { dateWord: epic.end_date.strftime(long_format) }
    end
  end
end
