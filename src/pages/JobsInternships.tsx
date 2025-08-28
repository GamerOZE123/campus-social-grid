
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DetailedJobForm from '@/components/jobs/DetailedJobForm';
import StudentApplicationForm from '@/components/jobs/StudentApplicationForm';
import StudentJobsView from '@/components/jobs/StudentJobsView';
import CompanyApplicantsView from '@/components/jobs/CompanyApplicantsView';

export default function JobsInternships() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userType, setUserType] = useState<'student' | 'company'>('student');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // Get user type
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) throw profileError;
        if (profileData) {
          setUserType(profileData.user_type || 'student');
          
          // Check if user has the appropriate profile
          if (profileData.user_type === 'student') {
            const { data: studentProfile, error: studentError } = await supabase
              .from('student_profiles')
              .select('id')
              .eq('user_id', user.id)
              .single();
            
            if (studentError && studentError.code !== 'PGRST116') {
              throw studentError;
            }
            setHasProfile(!!studentProfile);
          } else {
            const { data: companyProfile, error: companyError } = await supabase
              .from('company_profiles')
              .select('id')
              .eq('user_id', user.id)
              .single();
            
            if (companyError && companyError.code !== 'PGRST116') {
              throw companyError;
            }
            setHasProfile(!!companyProfile);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleFormComplete = () => {
    setShowForm(false);
    setHasProfile(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Show form if user doesn't have profile yet
  if (showForm || !hasProfile) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/university')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">
                {userType === 'student' ? 'Complete Your Profile' : 'Company Setup'}
              </h1>
            </div>
            {userType === 'company' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/university')}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {userType === 'company' ? (
            <DetailedJobForm 
              onComplete={handleFormComplete}
              onCancel={() => navigate('/university')}
            />
          ) : (
            <StudentApplicationForm 
              onComplete={handleFormComplete}
              onCancel={() => navigate('/university')}
            />
          )}
        </div>
      </Layout>
    );
  }

  // Show the appropriate jobs view based on user type
  return (
    <Layout>
      <div className="space-y-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/university')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              {userType === 'student' ? 'Explore Jobs' : 'Job Applications'}
            </h1>
          </div>
          {userType === 'company' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/university')}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {userType === 'student' ? <StudentJobsView /> : <CompanyApplicantsView />}
      </div>
    </Layout>
  );
}
