import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TierFeatures {
  postsPerMonth: number;
  targeting: string;
  analytics: string;
  bannerAds: boolean;
  priorityPlacement: boolean;
  support: string;
}

interface SubscriptionTierCardProps {
  tier: 'starter' | 'growth' | 'premium';
  title: string;
  price: string;
  description: string;
  features: TierFeatures;
  currentTier: string;
  popular?: boolean;
  onUpgrade: () => void;
}

export default function SubscriptionTierCard({
  tier,
  title,
  price,
  description,
  features,
  currentTier,
  popular = false,
  onUpgrade
}: SubscriptionTierCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isCurrentTier = currentTier === tier;
  const canDowngrade = currentTier === 'premium' && (tier === 'growth' || tier === 'starter');
  const canUpgrade = !isCurrentTier && !canDowngrade;

  const getTierIcon = () => {
    switch (tier) {
      case 'starter':
        return <Zap className="w-5 h-5" />;
      case 'growth':
        return <Star className="w-5 h-5" />;
      case 'premium':
        return <Crown className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'starter':
        return 'from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800';
      case 'growth':
        return 'from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800';
      case 'premium':
        return 'from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800';
      default:
        return '';
    }
  };

  const handleTierChange = async () => {
    if (!user) return;

    try {
      const newAnalyticsTier = tier === 'starter' ? 'basic' : tier === 'growth' ? 'standard' : 'advanced';
      const newPostsLimit = tier === 'starter' ? 5 : tier === 'growth' ? 15 : 25;

      const { error } = await supabase
        .from('company_profiles')
        .update({
          subscription_tier: tier,
          monthly_posts_limit: newPostsLimit,
          analytics_tier: newAnalyticsTier,
          targeting_enabled: tier !== 'starter',
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Successfully updated to ${title} plan!`
      });

      onUpgrade();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className={`relative ${getTierColor()} ${popular ? 'ring-2 ring-primary' : ''}`}>
      {popular && (
        <Badge 
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground"
        >
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getTierIcon()}
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <div className="text-3xl font-bold">
          {price}
          {price !== 'Free' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">{features.postsPerMonth} posts per month</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">Targeting: {features.targeting}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">Analytics: {features.analytics}</span>
          </div>
          
          {features.bannerAds && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm">Homepage Banner Ads</span>
            </div>
          )}
          
          {features.priorityPlacement && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm">Priority Placement</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">Support: {features.support}</span>
          </div>
        </div>

        <Button
          className="w-full"
          variant={isCurrentTier ? "secondary" : "default"}
          disabled={isCurrentTier}
          onClick={handleTierChange}
        >
          {isCurrentTier ? "Current Plan" : canUpgrade ? `Upgrade to ${title}` : `Switch to ${title}`}
        </Button>
      </CardContent>
    </Card>
  );
}