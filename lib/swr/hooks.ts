"use client";

import useSWR, { mutate } from "swr";
import {
  getOrCreateWeeklyPlan,
  getSubjects,
  getPublishers,
  getResources,
  getUserResources,
} from "@/lib/actions/plans";
import { getTopicCompletionsForCoach } from "@/lib/actions/topic-completions";
import { getVideos, getChannels } from "@/lib/actions/videos";
import { getSavedVideos, getSavedVideoIds } from "@/lib/actions/saved-videos";
import { getStats } from "@/lib/actions/stats";
import { getRecentExams } from "@/lib/actions/practice-exams";
import { getSubscription } from "@/lib/actions/subscription";
import { getProfile } from "@/lib/actions/profile";
import { SWR_KEYS } from "./keys";

const defaultSwrOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
  keepPreviousData: true,
};

/** Haftalık plan + görevler - Dashboard ana sayfa */
export function useWeeklyPlan() {
  return useSWR(SWR_KEYS.weeklyPlan, getOrCreateWeeklyPlan, defaultSwrOptions);
}

/** İstatistikler */
export function useStats() {
  return useSWR(SWR_KEYS.stats, getStats, defaultSwrOptions);
}

/** Video sayfası verisi - videolar, kanallar, kayıtlı videolar */
export function useVideolarData() {
  async function fetcher() {
    const [videos, channels, savedVideos, savedIds] = await Promise.all([
      getVideos(),
      getChannels(),
      getSavedVideos(),
      getSavedVideoIds(),
    ]);
    const channelMap = new Map(channels.map((c) => [c.channel_id, c.channel_name]));
    const videosWithChannel = videos.map((v) => ({
      ...v,
      channel_name: v.channel_id ? channelMap.get(v.channel_id) ?? "" : "",
    }));
    return { videos: videosWithChannel, channels, savedVideos, savedIds };
  }
  return useSWR(SWR_KEYS.videolar, fetcher, defaultSwrOptions);
}

/** Görev ekle sayfası - subjects, publishers, resources */
export function useGorevEkleData() {
  async function fetcher() {
    const [subjects, publishers, dersResources, denemeResources, userResources] =
      await Promise.all([
        getSubjects(),
        getPublishers(),
        getResources("ders"),
        getResources("deneme"),
        getUserResources(),
      ]);
    return {
      subjects,
      publishers,
      dersResources,
      denemeResources,
      userResources,
    };
  }
  return useSWR(SWR_KEYS.gorevEkle, fetcher, defaultSwrOptions);
}

/** Son 5 deneme sonucu */
export function usePracticeExams() {
  return useSWR(SWR_KEYS.practiceExams, () => getRecentExams(5), defaultSwrOptions);
}

/** Abonelik bilgisi */
export function useSubscription() {
  return useSWR(SWR_KEYS.subscription, getSubscription, defaultSwrOptions);
}

/** AI Koç için: kaynaklar + konu tamamlamaları + profil coach_resource_ids */
export function useCoachData() {
  async function fetcher() {
    const [gorevData, topicRes, profile] = await Promise.all([
      (async () => {
        const [subjects, publishers, dersRes, denemeRes, userRes] = await Promise.all([
          getSubjects(),
          getPublishers(),
          getResources("ders"),
          getResources("deneme"),
          getUserResources(),
        ]);
        return { subjects, publishers, dersResources: dersRes, denemeResources: denemeRes, userResources: userRes };
      })(),
      getTopicCompletionsForCoach(),
      getProfile(),
    ]);
    const coachIds = (profile as { coach_resource_ids?: { t: string; id: string }[] } | null)?.coach_resource_ids ?? [];
    return {
      ...gorevData,
      topicCompletions: topicRes.completions,
      coachResourceIds: Array.isArray(coachIds) ? coachIds : [],
    };
  }
  return useSWR(SWR_KEYS.coachData, fetcher, defaultSwrOptions);
}

/** Kullanıcı profili (exam_type, study_field, target_year vb.) */
export function useProfile() {
  return useSWR(SWR_KEYS.profile, getProfile, defaultSwrOptions);
}

/** Belirli key'i yeniden doğrula */
export function revalidateKey(key: keyof typeof SWR_KEYS) {
  return mutate(SWR_KEYS[key]);
}
