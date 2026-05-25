from apscheduler.schedulers.asyncio import AsyncIOScheduler


class ScraperScheduler:
    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()

    def start(self, refresh_callback) -> None:
        self.scheduler.add_job(refresh_callback, "interval", minutes=60, id="dashboard_refresh", replace_existing=True)
        self.scheduler.start()

    def stop(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
