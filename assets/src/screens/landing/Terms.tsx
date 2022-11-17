import { useEffect } from 'preact/hooks'

import Helmet from '@/components/core/Helmet'
import LandingLayout from '@/components/layout/LandingLayout'
import { paths } from '@/config'

type Props = {
  path: string
}

export default (props: Props) => {
  useEffect(() => window.scrollTo(0, 0), [])

  return (
    <LandingLayout darkFooter>
      <div class="bg-lavender-50">
        <Helmet title="Terms of Use" />
        <div class="max-w-4xl mx-auto legal px-8 my-10">
          <h1>Terms of Use</h1>
          <p>Effective date: October 21, 2022</p>
          <p>
            Welcome to Daybird. Please read on to learn the rules and restrictions that govern your
            use of our website(s), products, services and applications, which include, but are not
            limited to, the Daybird app (the “Services”). If you have any questions, comments, or
            concerns regarding these terms or the Services, please contact us at support@daybird.app
            or write us at Bridge to the Future LLC, 650 Castro St., Suite 120-267, Mountain View,
            CA 94041
          </p>
          <p>
            These Terms of Use (the “Terms”) are a binding contract between you and Bridge to the
            Future, LLC. ("Daybird", "we" and "us"). You must agree to and accept all of the Terms,
            or you don’t have the right to use the Services. Your use of the Services in any way
            means that you agree to all of these Terms, and these Terms will remain in effect while
            you use the Services. These Terms include the provisions in this document, as well as
            those in the (
            <a href={paths.PRIVACY} title="Privacy Policy">
              Privacy Policy
            </a>
            ).
          </p>
          <h2>WILL THESE TERMS EVER CHANGE?</h2>
          <p>
            We are constantly trying to improve our Services, so these Terms may need to change
            along with the Services. We reserve the right to change the Terms at any time, but if we
            do, we will bring it to your attention by placing a notice on the Daybird website, by
            sending you an email, and/or by some other means.
          </p>
          <p>
            If you don’t agree with the new Terms, you are free to reject them; unfortunately, that
            means you will no longer be able to use the Services. If you use the Services in any way
            after a change to the Terms is effective, that means you agree to all of the changes.
          </p>
          <p>
            Except for changes by us as described here, no other amendment or modification of these
            Terms will be effective unless in writing and signed by both you and us.
          </p>
          <h2>WHAT ABOUT MY PRIVACY?</h2>
          <p>
            Daybird takes the privacy of its users very seriously. For the current Daybird Privacy
            Policy, please click{' '}
            <a href={paths.PRIVACY} title="Privacy Policy">
              here
            </a>
            .
          </p>
          <p>
            The Children’s Online Privacy Protection Act (“COPPA”) requires that online service
            providers obtain parental consent before they knowingly collect personally identifiable
            information online from children who are under 13. We do not knowingly collect or
            solicit personally identifiable information from children under 13; if you are a child
            under 13, please do not attempt to register for the Services or send any personal
            information about yourself to us. If we learn that we have collected personal
            information from a child under 13, we will delete that information as quickly as
            possible. If you believe that a child under 13 may have provided us personal
            information, please contact us at support@daybird.app.
          </p>
          <h2>WHAT ARE THE BASICS OF USING THE SERVICES?</h2>
          You may be required to sign up for an account, and select a password and user name (“User
          ID”). You promise to provide us with accurate, complete, and updated registration
          information about yourself. For your User ID, you may not select a name that you do not
          have the right to use, or another person’s name with the intent to impersonate that
          person. You may not transfer your account to anyone else without our prior written
          permission. You represent and warrant that you are of legal age to form a binding contract
          (or if not, you’ve received your parent’s or guardian’s permission to use the Services and
          gotten your parent or guardian to agree to these Terms on your behalf). If you’re agreeing
          to these Terms on behalf of an organization or entity, you represent and warrant that you
          are authorized to agree to these Terms on that organization or entity’s behalf and bind
          them to these Terms (in which case, the references to “you” and “your” in these Terms,
          except for in this sentence, refer to that organization or entity). You will only use the
          Services for your own personal or business use and only in a manner that complies with all
          laws that apply to you. If applicable laws prohibit your use of the Services, then you
          aren’t authorized to use the Services. We can’t and won’t be responsible for your use of
          the Services in a way that breaks the law. You will not share your account or password
          with anyone, and you must protect the security of your account and your password. You are
          responsible for any activity associated with your account.
          <h2>Your use of the Services is subject to the following additional restrictions:</h2>
          You represent, warrant, and agree that you will not contribute any Content or User
          Submission (each of those terms is defined below) or otherwise use the Services or
          interact with the Services in a manner that: Infringes or violates the intellectual
          property rights or any other rights of anyone else (including Daybird);
          <ol>
            <li>Violates any law or regulation;</li>
            <li>
              Is harmful, fraudulent, deceptive, threatening, harassing, defamatory, obscene, or
              otherwise objectionable;
            </li>
            <li>
              Jeopardizes the security of your Daybird account or anyone else’s (such as allowing
              someone else to log in to the Services as you);
            </li>
            <li>
              Attempts, in any manner, to obtain the password, account, or other security
              information from any other user;
            </li>
            <li>
              Violates the security of any computer network, or cracks any passwords or security
              encryption codes;
            </li>
            <li>
              Runs Maillist, Listserv, any form of auto-responder or “spam” on the Services, or any
              processes that run or are activated while you are not logged into the Services, or
              that otherwise interfere with the proper working of the Services (including by placing
              an unreasonable load on the Services’ infrastructure);
            </li>
            <li>
              Uses any intellectual property rights protected by applicable laws and contained in or
              accessible through the Services for the purpose of building a competitive product or
              service or copying its features or user interface;
            </li>
            <li>
              Uses the Services, or permits it to be used, for purposes of product benchmarking or
              other comparative analysis intended for publication without Daybird's prior written
              consent;
            </li>
            <li>
              Uses the Services to develop or enhance any software, software code, or any derivative
              works of any software without Daybird's prior written consent;
            </li>
            <li>
              Uses the Services as a direct competitor of Daybird or for the purpose of monitoring
              the Services’ availability, performance, functionality or for any other benchmarking
              or competitive purposes;
            </li>
            <li>
              "Crawls," "scrapes," or "spiders" any page, data, or portion of or relating to the
              Services or Content (through use of manual or automated means);
            </li>
            <li>Copies or stores any significant portion of the Content;</li>
            <li>
              Decompiles, reverse engineers, or otherwise attempts to obtain the source code or
              underlying ideas or information of or relating to the Services.
            </li>
          </ol>
          <p>
            A violation of any of the foregoing is grounds for termination of your right to use or
            access the Services.
          </p>
          <h2>WHAT ARE MY RIGHTS IN THE SERVICES?</h2>
          <p>
            The materials displayed or performed or available on or through the Services, including,
            but not limited to, text, graphics, data, articles, photos, images, illustrations, User
            Submissions, and so forth (all of the foregoing, the “Content”) are protected by
            copyright and/or other intellectual property laws. You promise to abide by all copyright
            notices, trademark rules, information, and restrictions contained in any Content you
            access through the Services, and you won’t use, copy, reproduce, modify, translate,
            publish, broadcast, transmit, distribute, perform, upload, display, license, sell or
            otherwise exploit for any purpose any Content not owned by you, (i) without the prior
            consent of the owner of that Content or (ii) in a way that violates someone else’s
            (including Daybird’s) rights.
          </p>
          <p>
            You understand that Daybird owns the Services. You won’t modify, publish, transmit,
            participate in the transfer or sale of, reproduce (except as expressly provided in this
            Section), creative derivative works based on, or otherwise exploit any of the Services.
          </p>
          <p>
            The Services may allow you to copy or download certain Content; please remember that
            just because this functionality exists, doesn’t mean that all the restrictions above
            don’t apply – they do!
          </p>
          <h2>WHO IS RESPONSIBLE FOR WHAT I SEE AND DO ON THE SERVICES?</h2>
          <p>
            Any information or content publicly posted or privately transmitted through the Services
            is the sole responsibility of the person from whom such content originated, and you
            access all such information and content at your own risk, and we aren’t liable for any
            errors or omissions in that information or content or for any damages or loss you might
            suffer in connection with it. We cannot control and have no duty to take any action
            regarding how you may interpret and use the Content or what actions you may take as a
            result of having been exposed to the Content, and you hereby release us from all
            liability for you having acquired or not acquired Content through the Services. We can’t
            guarantee the identity of any users with whom you interact in using the Services and are
            not responsible for which users gain access to the Services.
          </p>
          <p>
            You are responsible for all Content you contribute, in any manner, to the Services, and
            you represent and warrant you have all rights necessary to do so, in the manner in which
            you contribute it. You will keep all your registration information accurate and current.
            You are responsible for all your activity in connection with the Services.
          </p>
          <p>
            The Services may contain links or connections to third party websites or services that
            are not owned or controlled by Daybird. When you access third party websites or use
            third party services, you accept that there are risks in doing so, and that Daybird is
            not responsible for such risks. We encourage you to be aware when you leave the Services
            and to read the terms and conditions and privacy policy of each third party website or
            service that you visit or utilize. Daybird has no control over, and assumes no
            responsibility for, the content, accuracy, privacy policies, or practices of or opinions
            expressed in any third party websites or by any third party that you interact with
            through the Services. In addition, Daybird will not and cannot monitor, verify, censor
            or edit the content of any third party site or service. By using the Services, you
            release and hold us harmless from any and all liability arising from your use of any
            third party website or service.
          </p>
          <p>
            Your interactions with organizations and/or individuals found on or through the
            Services, including payment and delivery of goods or services, and any other terms,
            conditions, warranties or representations associated with such dealings, are solely
            between you and such organizations and/or individuals. You should make whatever
            investigation you feel necessary or appropriate before proceeding with any online or
            offline transaction with any of these third parties. You agree that Daybird shall not be
            responsible or liable for any loss or damage of any sort incurred as the result of any
            such dealings.
          </p>
          <p>
            If there is a dispute between participants on this site, or between users and any third
            party, you agree that Daybird is under no obligation to become involved. In the event
            that you have a dispute with one or more other users, you release Daybird, its officers,
            employees, agents, and successors from claims, demands, and damages of every kind or
            nature, known or unknown, suspected or unsuspected, disclosed or undisclosed, arising
            out of or in any way related to such disputes and/or our Services. If you are a
            California resident, you shall and hereby do waive California Civil Code Section 1542,
            which says: "A general release does not extend to claims which the creditor does not
            know or suspect to exist in his favor at the time of executing the release, which, if
            known by him must have materially affected his settlement with the debtor."
          </p>
          <h2>WILL Daybird EVER CHANGE THE SERVICES?</h2>
          <p>
            We’re always trying to improve the Services, so they may change over time. We may
            suspend or discontinue any part of the Services, or we may introduce new features or
            impose limits on certain features or restrict access to parts or all of the Services.
            We’ll try to give you notice when we make a material change to the Services that would
            adversely affect you, but this isn’t always practical. Similarly, we reserve the right
            to remove any Content from the Services at any time, for any reason (including, but not
            limited to, if someone alleges you contributed that Content in violation of these
            Terms), in our sole discretion, and without notice.
          </p>
          <h2>DO THE SERVICES COST ANYTHING?</h2>
          <p>
            Some of the Daybird Services are currently free, but we reserve the right to charge for
            certain or all Services in the future. We will notify you before any Services you are
            currently using begin carrying a fee, and if you wish to continue using such Services,
            you must pay all applicable fees for such Services.
          </p>
          <p>
            If you choose to sign up for any Services that carry a fee (the “Paid Services”) you
            will be charged the then current fees for such Paid Services. Unless otherwise agreed,
            all fees paid to Daybird are non-refundable.
          </p>
          <h2>WHAT IF I WANT TO STOP USING THE SERVICES?</h2>
          <p>
            You’re free to do that at any time, by contacting us at support@daybird.app; please
            refer to our{' '}
            <a href={paths.PRIVACY} title="Privacy Policy">
              Privacy Policy
            </a>
            , as well as the licenses above, to understand how we treat information you provide to
            us after you have stopped using our Services.
          </p>
          <p>
            Daybird is also free to terminate (or suspend access to) your use of the Services or
            your account, for any reason in our discretion, including your breach of these Terms.
            Daybird has the sole right to decide whether you are in violation of any of the
            restrictions set forth in these Terms.
          </p>
          <p>
            Account termination may result in destruction of any Content associated with your
            account, so keep that in mind before you decide to terminate your account. We will try
            to provide advance notice to you prior to our terminating your account so that you are
            able to retrieve any important User Submissions you may have stored in your account (to
            the extent allowed by law and these Terms), but we may not do so if we determine it
            would be impractical, illegal, not in the interest of someone’s safety or security, or
            otherwise harmful to the rights or property of Daybird.
          </p>
          <p>
            If you have deleted your account by mistake, contact us immediately at
            support@daybird.app – we will try to help, but unfortunately, we can’t promise that we
            can recover or restore anything.
          </p>
          <p>
            Provisions that, by their nature, should survive termination of these Terms shall
            survive termination. By way of example, all of the following will survive termination:
            any obligation you have to pay us or indemnify us, any limitations on our liability, any
            terms regarding ownership or intellectual property rights, and terms regarding disputes
            between us.
          </p>
          <h2>WHAT ELSE DO I NEED TO KNOW?</h2>
          <p>
            <strong>Warranty Disclaimer.</strong> Daybird does not make any representations or
            warranties concerning any content contained in or accessed through the Services, and we
            will not be responsible or liable for the accuracy, copyright compliance, legality, or
            decency of material contained in or accessed through the Services. We make no
            representations or warranties regarding suggestions or recommendations of services or
            products offered or purchased through the Services. Products and services purchased or
            offered (whether or not following such recommendations and suggestions) through the
            Services are provided “AS IS” and without any warranty of any kind from Daybird or
            others (unless, with respect to such others only, provided expressly and unambiguously
            in writing by a designated third party for a specific product). THE SERVICES AND CONTENT
            ARE PROVIDED ON AN “AS-IS” BASIS, WITHOUT WARRANTIES OR ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT USE OF THE SERVICES WILL BE
            UNINTERRUPTED OR ERROR-FREE. SOME STATES DO NOT ALLOW LIMITATIONS ON HOW LONG AN IMPLIED
            WARRANTY LASTS, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
          </p>
          <p>
            <strong>Limitation of Liability.</strong> TO THE FULLEST EXTENT ALLOWED BY APPLICABLE
            LAW, UNDER NO CIRCUMSTANCES AND UNDER NO LEGAL THEORY (INCLUDING, WITHOUT LIMITATION,
            TORT, CONTRACT, STRICT LIABILITY, OR OTHERWISE) SHALL Daybird BE LIABLE TO YOU OR TO ANY
            OTHER PERSON FOR (A) ANY INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY
            KIND, INCLUDING DAMAGES FOR LOST PROFITS, LOSS OF GOODWILL, WORK STOPPAGE, ACCURACY OF
            RESULTS, OR COMPUTER FAILURE OR MALFUNCTION, OR (B) ANY AMOUNT, IN THE AGGREGATE, IN
            EXCESS OF THE GREATER OF (I) $100 OR (II) THE AMOUNTS PAID BY YOU TO Daybird IN
            CONNECTION WITH THE SERVICES IN THE TWELVE (12) MONTH PERIOD PRECEDING THIS APPLICABLE
            CLAIM, OR (III) ANY MATTER BEYOND OUR REASONABLE CONTROL. SOME STATES DO NOT ALLOW THE
            EXCLUSION OR LIMITATION OF CERTAIN DAMAGES, SO THE ABOVE LIMITATION AND EXCLUSIONS MAY
            NOT APPLY TO YOU.
          </p>
          <p>
            <strong>Indemnity.</strong> To the fullest extent allowed by applicable law, You agree
            to indemnify and hold Daybird, its affiliates, officers, agents, employees, and partners
            harmless from and against any and all claims, liabilities, damages (actual and
            consequential), losses and expenses (including attorneys’ fees) arising from or in any
            way related to any third party claims relating to (a) your use of the Services
            (including any actions taken by a third party using your account), and (b) your
            violation of these Terms. In the event of such a claim, suit, or action (“Claim”), we
            will attempt to provide notice of the Claim to the contact information we have for your
            account (provided that failure to deliver such notice shall not eliminate or reduce your
            indemnification obligations hereunder.
          </p>
          <p>
            <strong>Assignment.</strong> You may not assign, delegate or transfer these Terms or
            your rights or obligations hereunder, or your Services account, in any way (by operation
            of law or otherwise) without Daybird’s prior written consent. We may transfer, assign,
            or delegate these Terms and our rights and obligations without consent.
          </p>
          <p>
            <strong>Choice of Law; Arbitration.</strong> These Terms are governed by and will be
            construed under the laws of the State of California, without regard to the conflicts of
            laws provisions thereof. Any dispute arising from or relating to the subject matter of
            these Terms shall be finally settled in San Francisco County, California, in English, in
            accordance with the Streamlined Arbitration Rules and Procedures of Judicial Arbitration
            and Mediation Services, Inc. ("JAMS") then in effect, by one commercial arbitrator with
            substantial experience in resolving intellectual property and commercial contract
            disputes, who shall be selected from the appropriate list of JAMS arbitrators in
            accordance with such Rules. Judgment upon the award rendered by such arbitrator may be
            entered in any court of competent jurisdiction. Notwithstanding the foregoing obligation
            to arbitrate disputes, each party shall have the right to pursue injunctive or other
            equitable relief at any time, from any court of competent jurisdiction. For all purposes
            of this Agreement, the parties consent to exclusive jurisdiction and venue in the state
            or federal courts located in, respectively, San Francisco County, California, or the
            Northern District of California.
          </p>
          <p>
            <strong>Miscellaneous.</strong> You will be responsible for paying, withholding, filing,
            and reporting all taxes, duties, and other governmental assessments associated with your
            activity in connection with the Services, provided that Daybird may, in its sole
            discretion, do any of the foregoing on your behalf or for itself as it sees fit. The
            failure of either you or us to exercise, in any way, any right herein shall not be
            deemed a waiver of any further rights hereunder. If any provision of these Terms is
            found to be unenforceable or invalid, that provision will be limited or eliminated, to
            the minimum extent necessary, so that these Terms shall otherwise remain in full force
            and effect and enforceable. You and Daybird agree that these Terms are the complete and
            exclusive statement of the mutual understanding between you and Daybird, and that it
            supersedes and cancels all previous written and oral agreements, communications and
            other understandings relating to the subject matter of these Terms, and that all
            modifications to these Terms must be in a writing signed by both parties (except as
            otherwise provided herein). No agency, partnership, joint venture, or employment is
            created as a result of these Terms and you do not have any authority of any kind to bind
            Daybird in any respect whatsoever. Except as expressly set forth in the section above
            regarding the Apple Application, you and Daybird agree there are no third party
            beneficiaries intended under these Terms.
          </p>
        </div>
      </div>
    </LandingLayout>
  )
}
