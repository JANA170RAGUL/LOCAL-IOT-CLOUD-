from sqlalchemy.orm import Session
from app.modules.settings.models.setting import Setting
from typing import List, Optional, Dict, Any

class SettingsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_category(self, category: str) -> List[Setting]:
        return self.db.query(Setting).filter(Setting.category == category).all()

    def get_by_key(self, key: str) -> Optional[Setting]:
        return self.db.query(Setting).filter(Setting.key == key).first()

    def update_category_settings(self, category: str, settings_dict: Dict[str, Any]) -> List[Setting]:
        updated_settings = []
        for key, value in settings_dict.items():
            setting = self.db.query(Setting).filter(
                Setting.category == category,
                Setting.key == key
            ).first()

            if setting:
                setting.value = value
            else:
                setting = Setting(
                    category=category,
                    key=key,
                    value=value
                )
                self.db.add(setting)
            updated_settings.append(setting)

        self.db.commit()
        for s in updated_settings:
            self.db.refresh(s)
        return updated_settings
