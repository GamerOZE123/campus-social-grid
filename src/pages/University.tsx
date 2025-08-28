import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Briefcase, 
  Store, 
  Calendar, 
  Users, 
  ShoppingBag, 
  Gavel,
  PlusCircle,
  Target,
  Dumbbell
} from 'lucide-react';

const universityOptions = [
  {
    id: 'jobs',
    title: 'Jobs & Internships',
    description: 'Find your next opportunity or post job openings',
    icon: Briefcase,
    path: '/jobs-internships',
    color: 'bg-blue-500',
    allowedFor: ['student', 'company']
  },
  {
    id: 'advertising',
    title: 'Advertising',
    description: 'Promote your business or services to students',
    icon: Target,
    path: '/advertising',
    color: 'bg-orange-500',
    allowedFor: ['company']
  },
  {
    id: 'clubs',
    title: 'Clubs & Organizations',
    description: 'Join clubs and connect with like-minded students',
    icon: Users,
    path: '/clubs',
    color: 'bg-purple-500',
    allowedFor: ['student']
  },
  {
    id: 'fitness',
    title: 'Fitness & Wellness',
    description: 'Track workouts, join challenges, and find workout partners',
    icon: Dumbbell,
    path: '/fitness',
    color: 'bg-emerald-500',
    allowedFor: ['student']
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Buy, sell, and bid on items with fellow students',
    icon: Store,
    path: '/marketplace',
    color: 'bg-green-500',
    allowedFor: ['student']
  },
  {
    id: 'holidays',
    title: 'Holiday Events',
    description: 'Discover and organize holiday celebrations',
    icon: Calendar,
    path: '/holidays',
    color: 'bg-pink-500',
    allowedFor: ['student']
  }
];

export default function University() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userType, setUserType] = useState<'student' | 'company'>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) {
          setUserType(data.user_type || 'student');
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserType();
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Filter options based on user type
  const filteredOptions = universityOptions.filter(option => 
    option.allowedFor.includes(userType)
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">University Hub</h1>
          <p className="text-muted-foreground">
            {userType === 'company' 
              ? 'Connect with students and promote your opportunities'
              : 'Everything you need for your university experience'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.id}
                onClick={() => navigate(option.path)}
                className="post-card cursor-pointer hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${option.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {userType === 'student' && (
          <div className="post-card text-center py-8">
            <PlusCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Need something else?</h3>
            <p className="text-muted-foreground">
              Can't find what you're looking for? Let us know what other features would help your university experience.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
