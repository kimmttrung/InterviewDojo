import { COUNTRIES } from './countries.utils';
import { CodeforcesLanguages } from './languages.utils';

export const CodeforcesMetadata = {
  /**
   * Lấy danh sách quốc gia được Codeforces hỗ trợ
   */
  getCountries(): string[] {
    return COUNTRIES;
  },

  /**
   * Lấy danh sách map giữa Extension và tên ngôn ngữ đầy đủ
   */
  getExtensions() {
    return Object.entries(CodeforcesLanguages.extensions).map(
      ([ext, typeId]) => ({
        language: CodeforcesLanguages.typeId[typeId],
        extension: `.${ext}`,
      }),
    );
  },

  /**
   * Lấy danh sách các ngôn ngữ và ID tương ứng để nộp bài
   */
  getLanguages() {
    return Object.entries(CodeforcesLanguages.typeId).map(([id, name]) => ({
      id,
      name,
    }));
  },
};
