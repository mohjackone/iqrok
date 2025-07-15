# Task A: Passage Retrieval (PR)

The task is defined as follows: Given a free-text question posed in MSA and a collection of Qur'anic passages that cover the Holy Qur'an, a system is required to return a ranked list of answer-bearing passages (i.e., passages that potentially enclose the answer(s) to the given question) from this collection. The question can be a factoid or non-factoid question. An example question is shown below.

To make the task more realistic (thus challenging), some questions may not have an answer in the Holy Qur'an. In such cases, the ideal system should return no answers; otherwise, it returns a ranked list of up to 10 answer-bearing Qur'anic passages.

## [Thematic Qur&#39;an Passage Collection (QPC)](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-A/data/Thematic_QPC)

This file contains 1,266 thematic Qur'anic passages that cover the whole Holy Qur'an. Thematic passage segmentation was conducted using the Thematic Holy Qur'an [1] https://surahquran.com/tafseel-quran.html. This tsv file has the following format:

    `<passage-id>` `<passage-text>`

where the passage-id has the format: *Chapter#:StartVerse#-EndVerse#*, and the passage-text (i.e., Qur’anic text) was taken from the normalized simple-clean text style (from Tanzil 1.0.2) https://tanzil.net/download/.

## [AyaTEC_v1.2 Dataset](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-A/data)

AyaTEC_v1.2 is composed of 199 questions from the [AyaTEC_v1.1 dataset](http://qufaculty.qu.edu.qa/telsayed/datasets/) (which constitute the training and development datasets for Task A), in addition to 52 new test questions for evaluating the systems in the PR task (Task A). Overall, AyaTEC_v1.2 includes a total of 37 *zero-answer* questions
(about 15%) that do not have an answer in the Holy Qur’an. The distribution of the training (70%), development (10%), and test (20%) splits are shown below. The differences between  the AyaTEC_v1.2 and AyaTEC_v1.1 datasets are listed [here](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-A/data/README.md).
<!---
| **Dataset** | **# Questions** | **Question-Passage Pairs**** |
| ----------------- | :-------------------: | :--------------------------------: |
| Training          |          174          |                972                |
| Development       |          25          |                160                |
-->

| **Dataset** | **%** | **# Questions** | **Question-Passage Pairs***|
|-------------|:-----:|:---------------:|:-------------------------:|
| Training    |  70%  |       174       |            972            |
| Development |  10%  |        25       |            160            |
| Test        |  20%  |        52       |            427            |
| All         | 100%  |       251       |          1,599            |

*Question-Passage pairs are included in the QRels datasets.


 These datsets are tab-delimted with the following format:

    `<question-id>`  `<question-text>`

The text encoding in all datasets is UTF-8.

## [The QRels Gold Datasets](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-A/data/qrels)

The query relevance judgements (QRels) datasets are jointly composed of 1,599  gold (answer-bearing) Qur'anic passage-IDs considered relevant to each question. For *zero-answer* questions, the `passage-id` will a have a value of "-1". The distribution of the QRels are shown in the table above, and they adopt the following [TREC format](https://trec.nist.gov/data/qrels_eng/):

    `<question-id>` Q0 `<passage-id>` `<relevance>`

## Evaluation

The following scripts are needed for evaluating the submissions to Task A:

* A [*submission checker* script](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-A/code) for checking the correctness of run files to be submitted.
* An [*evaluation* (or *scorer*) script](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-A/code).

## References

[1] Swar, M. N., 2007. Mushaf Al-Tafseel Al-Mawdoo’ee. Damascus: Dar Al-Fajr Al-Islami.
