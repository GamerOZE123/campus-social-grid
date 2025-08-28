import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Mail, ExternalLink, GraduationCap, Briefcase, Clock } from 'lucide-react';

interface JobApplication {
  id: string;
  applied_at: string;
  status: string;
  student_profiles: {
    id: string;
    user_id: string;
    skills: string[];
    experience_level: string;
    preferred_job_types: string[];
    preferred_location: string;
    profiles: {
      full_name: string;
      avatar_url: string;
      university: string;
      major: string;
      email: string;
    };
  };
  jobs: {
    title: string;
    id: string;
  };
}

export default function CompanyApplicantsView() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobApplications();
  }, []);

  const fetchJobApplications = async () => {
    if (!user) return;
    
    try {
      // First get company's jobs, then get applications for those jobs
      const { data: companyJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', user.id);

      if (jobsError) throw jobsError;

      if (!companyJobs || companyJobs.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const jobIds = companyJobs.map(job => job.id);

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            title,
            id
          )
        `)
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Get student profiles separately
      const studentIds = data?.map(app => app.student_id) || [];
      let studentProfiles: any[] = [];
      
      if (studentIds.length > 0) {
        const { data: students, error: studentsError } = await supabase
          .from('student_profiles')
          .select(`
            *,
            profiles (
              full_name,
              avatar_url,
              university,
              major,
              email
            )
          `)
          .in('user_id', studentIds);

        if (studentsError) throw studentsError;
        studentProfiles = students || [];
      }

      // Combine applications with student profiles
      const applicationsWithProfiles = data?.map(app => ({
        ...app,
        student_profiles: studentProfiles.find(sp => sp.user_id === app.student_id)
      })).filter(app => app.student_profiles) || [];

      setApplications(applicationsWithProfiles);
    } catch (error) {
      console.error('Error fetching job applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactStudent = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      
      // Refresh applications
      fetchJobApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'reviewed': return 'secondary';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Applications Yet</h3>
        <p className="text-muted-foreground">
          Students haven't applied for your jobs yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Job Applications</h2>
        <p className="text-muted-foreground">
          Review {applications.length} applications from talented students
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {applications.map((application) => (
          <Card key={application.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={application.student_profiles.profiles.avatar_url} />
                  <AvatarFallback>
                    {application.student_profiles.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'ST'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {application.student_profiles.profiles.full_name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    {application.student_profiles.profiles.major} at {application.student_profiles.profiles.university}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Briefcase className="w-4 h-4 mr-1" />
                    Applied for: {application.jobs.title}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    Applied: {new Date(application.applied_at).toLocaleDateString()}
                  </div>
                  {application.student_profiles.preferred_location && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {application.student_profiles.preferred_location}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={getStatusColor(application.status)} className="capitalize">
                {application.status}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Experience Level</h4>
                <Badge variant="secondary">{application.student_profiles.experience_level}</Badge>
              </div>

              {application.student_profiles.skills && application.student_profiles.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {application.student_profiles.skills.slice(0, 6).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {application.student_profiles.skills.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{application.student_profiles.skills.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {application.student_profiles.preferred_job_types && application.student_profiles.preferred_job_types.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Job Type Preferences</h4>
                  <div className="flex flex-wrap gap-1">
                    {application.student_profiles.preferred_job_types.map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleContactStudent(application.student_profiles.profiles.email)}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Profile
              </Button>
              {application.status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => updateApplicationStatus(application.id, 'accepted')}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => updateApplicationStatus(application.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}