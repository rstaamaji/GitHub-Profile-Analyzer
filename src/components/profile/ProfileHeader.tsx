import React from 'react';
import {
  MapPin,
  Link as LinkIcon,
  AtSign,
  Building,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type { GitHubUser } from '../../types/github';

interface ProfileHeaderProps {
  user: GitHubUser;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 sm:p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 md:gap-8 items-start">
        {/* Avatar */}
        <div className="relative shrink-0 self-start">
          <img
            src={user.avatar_url}
            alt={`${user.name || user.login}'s profile picture`}
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 border-[#30363d] bg-[#21262d] object-cover"
          />
          {user.hireable && (
            <span className="absolute -bottom-1.5 right-0 px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-[10px] font-semibold rounded-full uppercase tracking-wider">
              Available
            </span>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 mb-2">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-100 break-words">
                {user.name || user.login}
              </h2>
              <div className="text-sm font-mono text-neutral-400 truncate">@{user.login}</div>
            </div>

            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${user.login}'s GitHub profile in a new tab`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-medium text-neutral-200 hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 shrink-0"
            >
              <span>GitHub Profile</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
            </a>
          </div>

          {user.bio && (
            <p className="text-neutral-300 text-sm leading-relaxed mb-3 sm:mb-4 break-words">
              {user.bio}
            </p>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-y-1.5 gap-x-3 sm:gap-x-4 text-xs text-neutral-300 pt-2 border-t border-[#21262d]">
            {user.company && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Building className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[180px] sm:max-w-[200px]">{user.company}</span>
              </div>
            )}
            {user.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                <span className="break-words">{user.location}</span>
              </div>
            )}
            {user.blog && (
              <div className="flex items-center gap-1.5 min-w-0">
                <LinkIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                <a
                  href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${user.login}'s website (opens in a new tab)`}
                  className="hover:text-blue-400 underline decoration-[#30363d] underline-offset-2 truncate max-w-[200px] sm:max-w-[220px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  {user.blog.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {user.twitter_username && (
              <div className="flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
                <a
                  href={`https://twitter.com/${user.twitter_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`@${user.twitter_username} on Twitter / X (opens in a new tab)`}
                  className="hover:text-blue-400 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  @{user.twitter_username}
                </a>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-neutral-400">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" aria-hidden="true" />
              <span>Joined {memberSince}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
