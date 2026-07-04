"""Scheduled jobs. Enable with ENABLE_SCHEDULER=1 (safe to run in a single web process
for this scale; move to a dedicated worker when traffic grows)."""

import os

import newsletter_ingest
import scraper


def start():
    if os.environ.get("ENABLE_SCHEDULER") != "1":
        return None
    from apscheduler.schedulers.background import BackgroundScheduler

    sched = BackgroundScheduler(timezone="UTC")
    sched.add_job(scraper.snapshot, "cron", hour=6, id="daily-snapshot")
    sched.add_job(newsletter_ingest.poll_imap, "interval", minutes=30, id="imap-poll")
    sched.add_job(_weekly_trend, "cron", day_of_week="mon", hour=7, id="weekly-trend")
    sched.start()
    return sched


def _weekly_trend():
    # local import to avoid circulars
    from trend_agent import run_trend_agent

    run_trend_agent()
