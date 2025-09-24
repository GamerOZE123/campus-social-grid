import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  popular?: boolean;
  currentTier: string;
  onUpgrade: () => void;
}

export default function SubscriptionTierCard({
  tier,
  title,
  price,
  description,
  features,
  popular,
  currentTier,
  onUpgrade
}: SubscriptionTierCardProps) {
  const { toast } = useToast();

  const getTierIcon = () => {
    switch (tier) {
      case 'starter':
        return <Star className="w-5 h-5" />;
      case 'growth':
        return <Zap className="w-5 h-5" />;
      case 'premium':
        return <Crown className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getTierColor = () => {
    switch (tier) {
      case 'starter':
        return 'text-muted-foreground border-border';
      case 'growth':
        return 'text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800';
      case 'premium':
        return 'text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800';
      default:
        return 'text-muted-foreground border-border';
    }
  };

  const isCurrentPlan = currentTier === tier;
  const canUpgrade = currentTier !== 'premium' && tier !== 'starter';
  const isDowngrade = 
    (currentTier === 'premium' && tier !== 'premium') ||
    (currentTier === 'growth' && tier === 'starter');

  const handleTierChange = async () => {
    try {
      const { error } = await supabase
        .from('company_profiles')
        .update({
          subscription_tier: tier,
          monthly_posts_limit: features.postsPerMonth,
          targeting_enabled: tier !== 'starter',
          analytics_tier: tier === 'premium' ? 'advanced' : tier === 'growth' ? 'standard' : 'basic'
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Subscription Updated",
        description: `Successfully upgraded to ${title} plan!`,
      });
      
      onUpgrade();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`relative h-full ${getTierColor()} ${popular ? 'ring-2 ring-primary' : ''}`}>
      {popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-2">
          {getTierIcon()}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="text-3xl font-bold">{price}</div>
        {price !== 'Free' && <span className="text-sm text-muted-foreground">/month</span>}
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
            <span className="text-sm">{features.analytics} analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${features.bannerAds ? 'text-green-500' : 'text-muted-foreground'}`} />
            <span className={`text-sm ${!features.bannerAds ? 'text-muted-foreground line-through' : ''}`}>
              Homepage banner ads
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${features.priorityPlacement ? 'text-green-500' : 'text-muted-foreground'}`} />
            <span className={`text-sm ${!features.priorityPlacement ? 'text-muted-foreground line-through' : ''}`}>
              Priority placement
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm">{features.support} support</span>
          </div>
        </div>
        
        <div className="pt-4">
          {isCurrentPlan ? (
            <Button disabled className="w-full">
              Current Plan
            </Button>
          ) : canUpgrade || !isDowngrade ? (
            <Button 
              onClick={handleTierChange}
              className="w-full"
              variant={tier === 'premium' ? 'default' : 'outline'}
            >
              {isDowngrade ? 'Downgrade' : 'Upgrade'} to {title}
            </Button>
          ) : (
            <Button disabled className="w-full">
              Contact Support
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}