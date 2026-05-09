import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { mentorApi } from '../api/mentorApi';

export default function MentorDetailPage() {
  const { mentorId } = useParams();
  const [mentor, setMentor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mentorId) return;

    const id = mentorId;

    async function fetchMentorDetail() {
      try {
        const [mentorData, slotData] = await Promise.all([
          mentorApi.getMentorDetail(id),
          mentorApi.getAvailableSlots(id),
        ]);

        setMentor(mentorData);
        setSlots(slotData);
      } catch (error) {
        console.error('Failed to fetch mentor detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMentorDetail();
  }, [mentorId]);

  if (loading) {
    return <div className="p-8">Loading mentor detail...</div>;
  }

  if (!mentor) {
    return <div className="p-8">Mentor not found</div>;
  }

  const experiences = mentor.mentorProfile?.experiences ?? [];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <main className="space-y-6">
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex gap-6">
                <img
                  src={mentor.avatarUrl || 'https://i.pravatar.cc/300'}
                  alt={mentor.name}
                  className="h-28 w-28 rounded-full object-cover"
                />

                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{mentor.name}</h1>

                  <p className="mt-2 text-lg text-gray-600">
                    {experiences[0]?.jobRole?.name || 'Mentor'}
                    {experiences[0]?.company?.name ? ` | ${experiences[0].company.name}` : ''}
                  </p>

                  <p className="mt-4 leading-7 text-gray-700">
                    {mentor.bio || 'This mentor has not added bio yet.'}
                  </p>

                  <p className="mt-3 text-sm text-gray-500">
                    {mentor.experienceYears || 0} years of experience
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">Experience</h2>

              <div className="mt-5 space-y-4">
                {experiences.length > 0 ? (
                  experiences.map((exp: any) => (
                    <div key={exp.id} className="rounded-xl border p-5">
                      <h3 className="text-lg font-semibold">{exp.jobRole?.name}</h3>

                      <p className="mt-1 text-gray-600">
                        {exp.company?.name}
                        {exp.company?.industry ? ` · ${exp.company.industry}` : ''}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(exp.startDate)} -{' '}
                        {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </p>

                      {exp.description && (
                        <p className="mt-3 leading-7 text-gray-700">{exp.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No experience added yet.</p>
                )}
              </div>
            </section>
          </main>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Available slots</h2>

            <div className="mt-4 space-y-3">
              {slots.length > 0 ? (
                slots.map((slot) => (
                  <button
                    key={slot.id}
                    className="w-full rounded-xl border px-4 py-3 text-left hover:border-purple-500 hover:bg-purple-50"
                  >
                    <p className="font-medium">{formatDateTime(slot.startTime)}</p>
                    <p className="text-sm text-gray-500">to {formatDateTime(slot.endTime)}</p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-500">This mentor has no available slots.</p>
              )}
            </div>

            <button className="mt-6 w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700">
              Request booking
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function formatDate(date?: string | null) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN');
}

function formatDateTime(date?: string | null) {
  if (!date) return '';
  return new Date(date).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
