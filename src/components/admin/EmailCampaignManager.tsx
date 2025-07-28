import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Users, TrendingUp, Clock, Eye, MousePointer,
  Target, Brain, Zap, Heart, Star, CheckCircle, XCircle,
  Edit, Copy, Trash2, Play, Pause, BarChart3
} from 'lucide-react';
import { ModernButton, ModernCard } from '../ModernDesignSystem';
import { toast } from 'sonner';

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  scheduledAt?: Date;
  sentAt?: Date;
  recipients: number;
  opens: number;
  clicks: number;
  psychologyTriggers: string[];
  segmentation: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  content: string;
  psychologyTriggers: string[];
  targetAudience: string[];
  conversionRate: number;
}

interface EmailCampaignManagerProps {
  postId?: string;
}

export const EmailCampaignManager: React.FC<EmailCampaignManagerProps> = ({ postId }) => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');

  const psychologyTriggers = [
    { id: 'scarcity', name: 'Scarcity', description: 'Limited time/availability', icon: Clock, color: 'text-red-600' },
    { id: 'social_proof', name: 'Social Proof', description: 'Others are doing it', icon: Users, color: 'text-blue-600' },
    { id: 'urgency', name: 'Urgency', description: 'Act now or miss out', icon: Zap, color: 'text-yellow-600' },
    { id: 'curiosity', name: 'Curiosity Gap', description: 'Create knowledge gaps', icon: Brain, color: 'text-purple-600' },
    { id: 'authority', name: 'Authority', description: 'Expert recommendations', icon: Star, color: 'text-green-600' },
    { id: 'reciprocity', name: 'Reciprocity', description: 'Give to receive', icon: Heart, color: 'text-pink-600' }
  ];

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/email/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const createCampaign = async (campaignData: Partial<EmailCampaign>) => {
    try {
      const response = await fetch('/api/admin/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      
      if (response.ok) {
        toast.success('Campaign created successfully');
        loadCampaigns();
        setShowCreateModal(false);
      }
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/email/campaigns/${campaignId}/send`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Campaign sent successfully');
        loadCampaigns();
      }
    } catch (error) {
      toast.error('Failed to send campaign');
    }
  };

  const scheduleCampaign = async (campaignId: string, scheduledAt: Date) => {
    try {
      const response = await fetch(`/api/admin/email/campaigns/${campaignId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: scheduledAt.toISOString() })
      });
      
      if (response.ok) {
        toast.success('Campaign scheduled successfully');
        loadCampaigns();
      }
    } catch (error) {
      toast.error('Failed to schedule campaign');
    }
  };

  const getStatusColor = (status: EmailCampaign['status']) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'sending': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const getTriggerIcon = (triggerId: string) => {
    const trigger = psychologyTriggers.find(t => t.id === triggerId);
    return trigger ? trigger.icon : Brain;
  };

  const tabs = [
    { id: 'campaigns', label: 'Campaigns', icon: Mail },
    { id: 'templates', label: 'Templates', icon: Edit },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <ModernCard variant="gradient-flow" padding="lg" className="text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-subtitle font-bold">Email Campaign Manager</h2>
            <p className="text-white/80">Manage automated email campaigns with psychological triggers</p>
          </div>
          <div className="text-right">
            <div className="text-title font-bold">{campaigns.length}</div>
            <div className="text-white/80">Total Campaigns</div>
          </div>
        </div>
      </ModernCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ModernCard variant="neumorphic" padding="lg" className="text-center">
          <Send className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <div className="text-subtitle font-bold text-gradient-accent">
            {campaigns.filter(c => c.status === 'sent').length}
          </div>
          <div className="text-medium-contrast">Campaigns Sent</div>
        </ModernCard>

        <ModernCard variant="glass" padding="lg" className="text-center">
          <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <div className="text-subtitle font-bold text-holographic">
            {campaigns.reduce((total, c) => total + c.recipients, 0).toLocaleString()}
          </div>
          <div className="text-medium-contrast">Total Recipients</div>
        </ModernCard>

        <ModernCard variant="default" padding="lg" className="text-center">
          <Eye className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <div className="text-subtitle font-bold text-gradient-flow">
            {campaigns.reduce((total, c) => total + c.opens, 0).toLocaleString()}
          </div>
          <div className="text-medium-contrast">Total Opens</div>
        </ModernCard>

        <ModernCard variant="brutalist" padding="lg" className="text-center">
          <MousePointer className="w-8 h-8 text-orange-600 mx-auto mb-3" />
          <div className="text-subtitle font-bold text-accent-primary">
            {campaigns.reduce((total, c) => total + c.clicks, 0).toLocaleString()}
          </div>
          <div className="text-medium-contrast">Total Clicks</div>
        </ModernCard>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-md rounded-xl p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-gradient-flow text-white shadow-lg' 
                  : 'text-medium-contrast hover:bg-gradient-flow-subtle hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Create Campaign Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-body-lg font-bold text-gradient-accent">Email Campaigns</h3>
            <ModernButton
              variant="default"
              intent="primary"
              icon={Mail}
              onClick={() => setShowCreateModal(true)}
            >
              Create Campaign
            </ModernButton>
          </div>

          {/* Campaigns List */}
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <ModernCard key={campaign.id} variant="default" padding="lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-high-contrast">{campaign.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-caption font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <p className="text-medium-contrast mb-3">{campaign.subject}</p>
                    
                    <div className="flex items-center space-x-6 text-body-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{campaign.recipients.toLocaleString()} recipients</span>
                      </div>
                      
                      {campaign.opens > 0 && (
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span>{campaign.opens} opens ({formatPercentage(campaign.opens, campaign.recipients)})</span>
                        </div>
                      )}
                      
                      {campaign.clicks > 0 && (
                        <div className="flex items-center space-x-1">
                          <MousePointer className="w-4 h-4 text-green-600" />
                          <span>{campaign.clicks} clicks ({formatPercentage(campaign.clicks, campaign.opens)})</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Psychology Triggers */}
                    {campaign.psychologyTriggers.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <div className="flex flex-wrap gap-1">
                          {campaign.psychologyTriggers.map((trigger) => {
                            const TriggerIcon = getTriggerIcon(trigger);
                            return (
                              <span
                                key={trigger}
                                className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-caption"
                              >
                                <TriggerIcon className="w-3 h-3 mr-1" />
                                {trigger}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    {campaign.status === 'draft' && (
                      <>
                        <ModernButton
                          variant="minimal"
                          intent="accent"
                          size="sm"
                          icon={Send}
                          onClick={() => sendCampaign(campaign.id)}
                        >
                          Send Now
                        </ModernButton>
                        <ModernButton
                          variant="minimal"
                          intent="secondary"
                          size="sm"
                          icon={Clock}
                          onClick={() => {
                            const date = prompt('Schedule for (YYYY-MM-DD HH:MM):');
                            if (date) scheduleCampaign(campaign.id, new Date(date));
                          }}
                        >
                          Schedule
                        </ModernButton>
                      </>
                    )}
                    
                    <ModernButton
                      variant="minimal"
                      intent="secondary"
                      size="sm"
                      icon={Edit}
                    >
                      Edit
                    </ModernButton>
                    
                    <ModernButton
                      variant="minimal"
                      intent="error"
                      size="sm"
                      icon={Trash2}
                    >
                      Delete
                    </ModernButton>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <h3 className="text-body-lg font-bold text-gradient-accent">Email Templates</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <ModernCard key={template.id} variant="neumorphic" padding="lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-high-contrast mb-1">{template.name}</h4>
                    <p className="text-body-sm text-medium-contrast">{template.description}</p>
                  </div>
                  
                  <div className="text-body-sm">
                    <div className="font-medium text-high-contrast mb-1">Subject Preview:</div>
                    <div className="text-medium-contrast italic">"{template.subject}"</div>
                  </div>
                  
                  {/* Psychology Triggers */}
                  <div className="flex flex-wrap gap-1">
                    {template.psychologyTriggers.map((trigger) => {
                      const triggerData = psychologyTriggers.find(t => t.id === trigger);
                      const TriggerIcon = triggerData?.icon || Brain;
                      return (
                        <span
                          key={trigger}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-caption ${triggerData?.color || 'text-gray-600'} bg-gray-100`}
                        >
                          <TriggerIcon className="w-3 h-3 mr-1" />
                          {triggerData?.name || trigger}
                        </span>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-body-sm">
                      <span className="text-green-600 font-medium">{template.conversionRate}%</span>
                      <span className="text-medium-contrast"> conversion</span>
                    </div>
                    
                    <ModernButton
                      variant="minimal"
                      intent="primary"
                      size="sm"
                      icon={Copy}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowCreateModal(true);
                      }}
                    >
                      Use Template
                    </ModernButton>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-body-lg font-bold text-gradient-accent">Campaign Analytics</h3>
          
          {/* Overall Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModernCard variant="glass" padding="lg" className="text-center">
              <div className="text-subtitle font-bold text-holographic mb-2">
                {campaigns.length > 0 
                  ? formatPercentage(
                      campaigns.reduce((total, c) => total + c.opens, 0),
                      campaigns.reduce((total, c) => total + c.recipients, 0)
                    )
                  : '0%'
                }
              </div>
              <div className="text-medium-contrast">Average Open Rate</div>
            </ModernCard>
            
            <ModernCard variant="neumorphic" padding="lg" className="text-center">
              <div className="text-subtitle font-bold text-gradient-accent mb-2">
                {campaigns.length > 0 
                  ? formatPercentage(
                      campaigns.reduce((total, c) => total + c.clicks, 0),
                      campaigns.reduce((total, c) => total + c.opens, 0)
                    )
                  : '0%'
                }
              </div>
              <div className="text-medium-contrast">Average Click Rate</div>
            </ModernCard>
            
            <ModernCard variant="default" padding="lg" className="text-center">
              <div className="text-subtitle font-bold text-gradient-flow mb-2">
                {campaigns.filter(c => c.status === 'sent').length > 0 
                  ? Math.round(
                      campaigns.reduce((total, c) => total + c.recipients, 0) / 
                      campaigns.filter(c => c.status === 'sent').length
                    ).toLocaleString()
                  : '0'
                }
              </div>
              <div className="text-medium-contrast">Avg Recipients per Campaign</div>
            </ModernCard>
          </div>

          {/* Psychology Trigger Performance */}
          <ModernCard variant="default" padding="lg">
            <h4 className="text-body font-bold mb-4 text-gradient-accent">Psychology Trigger Performance</h4>
            <div className="space-y-3">
              {psychologyTriggers.map((trigger) => {
                const campaignsWithTrigger = campaigns.filter(c => 
                  c.psychologyTriggers.includes(trigger.id) && c.status === 'sent'
                );
                const totalOpens = campaignsWithTrigger.reduce((total, c) => total + c.opens, 0);
                const totalRecipients = campaignsWithTrigger.reduce((total, c) => total + c.recipients, 0);
                const openRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
                
                const Icon = trigger.icon;
                
                return (
                  <div key={trigger.id} className="flex items-center justify-between p-3 bg-low-contrast rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${trigger.color}`} />
                      <div>
                        <div className="font-medium text-high-contrast">{trigger.name}</div>
                        <div className="text-body-sm text-medium-contrast">{trigger.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-high-contrast">{openRate.toFixed(1)}%</div>
                      <div className="text-caption text-low-contrast">{campaignsWithTrigger.length} campaigns</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ModernCard>
        </div>
      )}
    </div>
  );
}; 