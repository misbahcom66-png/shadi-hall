import { Award, HeartHandshake, Sparkles, UserCheck } from 'lucide-react';
import { SITE_CONFIG, TEAM_MEMBERS, usePageSeo } from '../config/site.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { useBookHallNavigation } from '../hooks/useBookHallNavigation.ts';

export function AboutPage() {
  usePageSeo('About Us', `Learn about ${SITE_CONFIG.businessName}, our hospitality mission, and leadership team.`);
  const navigateToBook = useBookHallNavigation();

  return (
    <div className="bg-white">
      <section className="section-spacing bg-[#F7F8FA]">
        <div className="site-container grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <div className="flex flex-col justify-center space-y-5">
            <h1 className="h1-title">Crafting Memorable Celebrations Since 2012</h1>
            <p className="body-text">
              {SITE_CONFIG.businessName} was founded with a clear purpose: to give families and event planners grand architectural spaces paired with transparent pricing and warm, attentive service.
            </p>
            <p className="body-text">
              From 800-guest wedding receptions beneath crystal chandeliers to sunlit botanical ceremonies, our team coordinates every detail—dining, floral staging, valet arrivals, and sound—under one roof.
            </p>
            <div className="pt-2">
              <button type="button" onClick={() => navigateToBook()} className="btn-primary">
                Book Hall
              </button>
            </div>
          </div>

          <div className="card-surface overflow-hidden min-h-[320px]">
            <SafeImage
              src="/src/assets/images/hall_garden_courtyard_1794825123834.jpg"
              alt="Sunlit Conservatory Venue"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="section-spacing bg-white">
        <div className="site-container space-y-10">
          <div className="max-w-xl space-y-2">
            <h2 className="h2-title">Our Hospitality Mission</h2>
            <p className="body-text">
              Simplicity in planning, excellence in execution, and genuine care for every guest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-surface p-6 space-y-3 border border-gray-100">
              <div className="w-11 h-11 rounded-[10px] bg-[#F7F8FA] text-[#201853] flex items-center justify-center">
                <Award className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="h3-title">Architectural Quality</h3>
              <p className="body-text">
                Thoughtfully maintained ballrooms with acoustic engineering, marble foyers, and bridal suites.
              </p>
            </div>
            <div className="card-surface p-6 space-y-3 border border-gray-100">
              <div className="w-11 h-11 rounded-[10px] bg-[#F7F8FA] text-[#201853] flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="h3-title">Honest Pricing</h3>
              <p className="body-text">
                Upfront hall rates and customizable service add-ons with real-time online reservation totals.
              </p>
            </div>
            <div className="card-surface p-6 space-y-3 border border-gray-100">
              <div className="w-11 h-11 rounded-[10px] bg-[#F7F8FA] text-[#201853] flex items-center justify-center">
                <Sparkles className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="h3-title">Seamless Coordination</h3>
              <p className="body-text">
                One dedicated event captain oversees setup, banquet service, and guest departures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="section-spacing bg-[#F7F8FA]">
        <div className="site-container space-y-10">
          <div className="max-w-xl space-y-2">
            <h2 className="h2-title">Meet Our Leadership Team</h2>
            <p className="body-text">
              Seasoned hospitality specialists dedicated to making your celebration effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div key={member.name} className="card-surface p-6 space-y-3">
                <div className="w-12 h-12 rounded-[12px] bg-[#201853] text-white flex items-center justify-center">
                  <UserCheck className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="h3-title">{member.name}</h3>
                  <p className="text-[14px] font-medium text-[#45459E]">{member.role}</p>
                </div>
                <p className="small-text">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
