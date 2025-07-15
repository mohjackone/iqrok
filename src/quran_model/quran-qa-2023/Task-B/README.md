# Task B: Machine Reading Comprehension (MRC)
The task is defined as follows: Given a Qur'anic passage that consists of consecutive verses in a specific Surah of the Holy Qur'an, and a free-text question posed in MSA over that passage, a system is required to extract all answers to that question that are stated in the given passage (rather than any answer as in Qur'an QA 2022). Each answer must be a span of text extracted from the given passage. The question can be a factoid or non-factoid question. An example is shown below.

To make the task more realistic (thus challenging), some questions do not have an answer in the Holy Qur'an (or in the given passage). In such cases, the ideal system should return no answers; otherwise, it returns a ranked list of up to 10 answer spans.

## Qur'anic Reading Comprehension Dataset (QRCD)
<!--As the development of the test set is still in progress, we only exhibit the distribution of the question-passage pairs and their associated question-passage-triplets in the training and development splits of the QRCD_v1.2 dataset (shown below). -->

<!--The aim is to have a split of 70%, 10%, and 20% for the training, development and test sets, respectively. -->

We exhibit in the table below the distribution of the question-passage (QP) pairs and their associated question-passage-answer (QPA) triplets in the  [QRCD_v1.2 dataset](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-B/data). It is composed of the 1,093 QP pairs of [QRCD_v1.1](https://gitlab.com/bigirqu/quranqa/-/tree/main/datasets?ref_type=heads), in addition to 469 new QP pairs. The total 1,562 QP pairs are coupled with their extracted answers to constitute 1,889 QPA triplets. Overall, QRCD_v1.2 includes a total of 76 QP pairs (about 5%) for questions that do not have an answer in the Holy Qur'an.  

| **QRCD_v1.2 Dataset** | **%** | **# Question-Passage Pairs** | **# Question-Passage-Answer Triplets** |
|-------------|:-----:|:----------------------------:|:--------------------------------------:|
| Training    |  64%  |             992              |                  1,179                 |
| Development |  10%  |             163              |                    220                 |
| Test        |  26%  |             407              |                    490                 |
| All         |  100% |           1,562              |                  1,889                 |

<!---
| **Dataset** | **%** |**# Questions** | **# Question-Passage  Pairs** | **# Question-Passage-Answer Triplets** |
|-------------|:-----:|:--------------:|:-----------------------------:|:---------------------------------------:|
| Training    |  70%  |      174       |             992               |                  1,179                  |
| Development |  10%  |       25       |             163               |                    220                  |
| Test        |  20%  |       51       |             407               |                    476                  |
| All         |  100% |      250       |           1,562               |                  1,875                  |
-->
<!--
|**Dataset** |**# Questions**|**# Question-Passage  Pairs**| **# Question-Passage-Answer  Triplets**|
|------------|:-------------:|:---------------------------:|:--------------------------------------:|
| Training   |      174      |             992             |                   1179                 |
| Development|       25      |             163             |                    220                 |
-->

A [*reader* script](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/code/read_write_qrcd.py) is provided for the dataset.

To simplify the structure of the dataset, each tuple contains one passage, one question and a list that may contain one or more answers to that question, as shown in [this figure](https://gitlab.com/bigirqu/quran-qa-2023/-/blob/main/Task-B/data/README.md). 

Each Qur’anic passage in QRCD may have more than one occurrence; and each *passage occurrence* is paired with a different question. Likewise, each question in *QRCD* may have more than one occurrence; and each *question occurrence* is paired with a different Qur’anic passage.

The source of the Qur'anic text in QRCD is the [Tanzil project download page](https://tanzil.net/download/), which provides verified versions of the Holy Qur'an in several scripting styles. We have chosen the *simple-clean* text style of Tanzil version 1.0.2. 

## Evaluation

The following scripts are needed for evaluating the submissions to Task B:
* A [*submission checker* script](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-B/code) for checking the correctness of run files to be submitted. 
* An [*evaluation* (or *scorer*) script](https://gitlab.com/bigirqu/quran-qa-2023/-/tree/main/Task-B/code).

<!--- ## How to cite
If you use the QRCD dataset in your research, please cite the following references:

* Malhas, R. and Elsayed, T., 2022. [Arabic Machine Reading Comprehension on the Holy Qur’an using CL-AraBERT](https://www.sciencedirect.com/science/article/pii/S0306457322001704). *Information Processing & Management*, 59(6), p.103068.

* Malhas, R. and Elsayed, T., 2020. [*AyaTEC*: Building a Reusable Verse-based Test Collection for Arabic Question Answering on the holy qur’an](https://www.sciencedirect.com/science/article/pii/S0306457322001704). *ACM Transactions on Asian and Low-Resource Language Information Processing (TALLIP)*, 19(6), pp.1-21. 
-->
