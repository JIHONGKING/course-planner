import type { Course } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface CourseNode {
  course: Course;
  score: number;
  dependencies: Set<string>;
  dependents: Set<string>;
}

export class OptimizedPlanGenerator {
  private courseGraph: Map<string, CourseNode> = new Map();
  private termWorkload: Map<string, number> = new Map();
  
  constructor(private courses: Course[]) {
    this.buildCourseGraph();
  }

  private buildCourseGraph() {
    // 과목 간 관계 그래프 구축
    for (const course of this.courses) {
      const node: CourseNode = {
        course,
        score: this.calculateBaseScore(course),
        dependencies: new Set(course.prerequisites.map(p => p.courseId)),
        dependents: new Set()
      };
      this.courseGraph.set(course.id, node);
    }

    // 의존성 관계 설정
    for (const [id, node] of this.courseGraph) {
      for (const depId of node.dependencies) {
        const depNode = this.courseGraph.get(depId);
        if (depNode) {
          depNode.dependents.add(id);
        }
      }
    }
  }

  private calculateBaseScore(course: Course): number {
    let score = 0;
    
    // 1. 성적 가중치 (40%)
    const gradeA = parseFloat(getGradeA(course.gradeDistribution));
    score += (gradeA / 100) * 40;
    
    // 2. 선수과목 영향도 (30%)
    const prerequisiteCount = course.prerequisites.length;
    const dependentScore = prerequisiteCount ? (30 / prerequisiteCount) : 30;
    score += dependentScore;
    
    // 3. 과목 레벨 가중치 (20%)
    const level = parseInt(course.level);
    score += (level / 500) * 20;
    
    // 4. 학점 가중치 (10%)
    score += (course.credits / 5) * 10;
    
    return score;
  }

  private calculateTermWorkloadScore(term: string, course: Course): number {
    const currentWorkload = this.termWorkload.get(term) || 0;
    const targetWorkload = 15; // 목표 학점
    const newWorkload = currentWorkload + course.credits;
    
    // 목표 학점에서 멀어질수록 페널티 부여
    return -Math.abs(targetWorkload - newWorkload) * 2;
  }

  private findOptimalTerm(course: Course, availableTerms: string[]): string {
    let bestTerm = availableTerms[0];
    let bestScore = -Infinity;

    for (const term of availableTerms) {
      if (!course.term.includes(term.split('-')[1])) continue;
      
      const workloadScore = this.calculateTermWorkloadScore(term, course);
      const termScore = workloadScore;
      
      if (termScore > bestScore) {
        bestScore = termScore;
        bestTerm = term;
      }
    }

    return bestTerm;
  }

  generateOptimalPlan(): Map<string, Course[]> {
    const plan = new Map<string, Course[]>();
    const available = new Set<string>();
    const assigned = new Set<string>();

    // 초기 선수과목이 없는 과목들 추가
    for (const [id, node] of this.courseGraph) {
      if (node.dependencies.size === 0) {
        available.add(id);
      }
    }

    // 각 학기 초기화
    const terms = ['1-Fall', '1-Spring', '2-Fall', '2-Spring', '3-Fall', '3-Spring', '4-Fall', '4-Spring'];
    terms.forEach(term => plan.set(term, []));

    // 과목 배치
    while (available.size > 0) {
      // 점수가 높은 순으로 정렬
      const sorted = Array.from(available)
        .map(id => this.courseGraph.get(id)!)
        .sort((a, b) => b.score - a.score);

      for (const node of sorted) {
        const optimalTerm = this.findOptimalTerm(node.course, terms);
        const termCourses = plan.get(optimalTerm)!;
        
        // 학기당 최대 학점 체크
        const termCredits = termCourses.reduce((sum, c) => sum + c.credits, 0);
        if (termCredits + node.course.credits <= 18) {
          termCourses.push(node.course);
          available.delete(node.course.id);
          assigned.add(node.course.id);
          this.termWorkload.set(optimalTerm, termCredits + node.course.credits);

          // 새로운 가능 과목 추가
          for (const depId of node.dependents) {
            const depNode = this.courseGraph.get(depId)!;
            if (Array.from(depNode.dependencies)
                .every(id => assigned.has(id))) {
              available.add(depId);
            }
          }
        }
      }
    }

    return plan;
  }
}