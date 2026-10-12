import React from 'react';
import { BookOpen, Users, UserCheck, Star, GitFork, Flame } from 'lucide-react';
import type { GitHubRepo, GitHubUser } from '../../types/github';
import { ProfileHeader } from './ProfileHeader';
import { StatCard } from './StatCard';
import { RepoList } from './RepoList';

interface ProfileOverviewProps {
  user: GitHubUser;
  repos: GitHubRepo[];
}

export const ProfileOverview: React.FC<ProfileOverviewProps> = ({ user, repos }) => {
  // Aggregate real statistics derived exclusively from fetched data
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
  const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0);
  const nonForkRepos = repos.filter((repo) => !repo.fork).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Public Repos"
          value={user.public_repos}
          icon={<BookOpen className="w-4 h-4 text-blue-400" />}
          hint={`${nonForkRepos} source in batch`}
        />
        <StatCard
          label="Followers"
          value={user.followers}
          icon={<Users className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          label="Following"
          value={user.following}
          icon={<UserCheck className="w-4 h-4 text-purple-400" />}
        />
        <StatCard
          label="Batch Stars"
          value={totalStars}
          icon={<Star className="w-4 h-4 text-amber-400" />}
          hint="From latest repos"
        />
        <StatCard
          label="Batch Forks"
          value={totalForks}
          icon={<GitFork className="w-4 h-4 text-sky-400" />}
          hint="From latest repos"
        />
        <StatCard
          label="Public Gists"
          value={user.public_gists}
          icon={<Flame className="w-4 h-4 text-orange-400" />}
        />
      </div>

      {/* Repository Listing */}
      <RepoList repos={repos} />
    </div>
  );
};
