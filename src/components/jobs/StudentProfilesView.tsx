import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Mail, ExternalLink, GraduationCap } from 'lucide-react';

interface StudentProfile {
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
}

export default function StudentProfilesView() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfiles();
  }, []);

  const fetchStudentProfiles = async () => {
    try {
      const { data, error } = await supabase
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
        .limit(20);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching student profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactStudent = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Student Profiles Yet</h3>
        <p className="text-muted-foreground">
          Students haven't started creating their job profiles yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Talented Students Looking for Opportunities</h2>
        <p className="text-muted-foreground">
          Connect with {students.length} students ready to jumpstart their careers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {students.map((student) => (
          <Card key={student.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={student.profiles.avatar_url} />
                <AvatarFallback>
                  {student.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'ST'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {student.profiles.full_name}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  {student.profiles.major} at {student.profiles.university}
                </div>
                {student.preferred_location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    {student.preferred_location}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Experience Level</h4>
                <Badge variant="secondary">{student.experience_level}</Badge>
              </div>

              {student.skills && student.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {student.skills.slice(0, 4).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {student.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{student.skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {student.preferred_job_types && student.preferred_job_types.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Interested In</h4>
                  <div className="flex flex-wrap gap-1">
                    {student.preferred_job_types.map((type, index) => (
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
                onClick={() => handleContactStudent(student.profiles.email)}
                className="flex-1"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}