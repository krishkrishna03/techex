const csv = require('csv-parser');
const { Readable } = require('stream');

class FileExtractor {
  static async extractFromJSON(buffer) {
    try {
      const fileContent = buffer.toString('utf-8');
      const data = JSON.parse(fileContent);

      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of questions');
      }

      const questions = data.map((item, index) => {
        if (!item.questionText || !item.options || !item.correctAnswer) {
          throw new Error(`Invalid question format at index ${index}`);
        }

        const options = item.options;
        if (!options.A || !options.B || !options.C || !options.D) {
          throw new Error(`Question at index ${index} must have options A, B, C, and D`);
        }

        if (!['A', 'B', 'C', 'D'].includes(item.correctAnswer)) {
          throw new Error(`Invalid correct answer at index ${index}: ${item.correctAnswer}`);
        }

        return {
          questionText: item.questionText,
          options: {
            A: options.A,
            B: options.B,
            C: options.C,
            D: options.D
          },
          correctAnswer: item.correctAnswer
        };
      });

      return questions;
    } catch (error) {
      throw error;
    }
  }

  static async extractFromCSV(buffer) {
    try {
      const questions = [];

      await new Promise((resolve, reject) => {
        const stream = Readable.from(buffer);
        stream
          .pipe(csv())
          .on('data', (row) => {
            try {
              const question = {
                questionText: row.question || row.questionText || row.Question,
                options: {
                  A: row.optionA || row.option_a || row.A || row['Option A'],
                  B: row.optionB || row.option_b || row.B || row['Option B'],
                  C: row.optionC || row.option_c || row.C || row['Option C'],
                  D: row.optionD || row.option_d || row.D || row['Option D']
                },
                correctAnswer: (row.correctAnswer || row.correct_answer || row.answer || row.Answer).toUpperCase()
              };

              if (!question.questionText ||
                  !question.options.A || !question.options.B ||
                  !question.options.C || !question.options.D ||
                  !['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
                console.warn('Skipping invalid row:', row);
                return;
              }

              questions.push(question);
            } catch (error) {
              console.warn('Error parsing row:', row, error);
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      if (questions.length === 0) {
        throw new Error('No valid questions found in CSV file. Please check the format.');
      }

      return questions;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = FileExtractor;
