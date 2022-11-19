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
        <Helmet title="Privacy Policy" />
        <div class="max-w-4xl mx-auto legal px-8 my-10">
          <h1>Privacy Policy</h1>

          <p>Last updated: October 21, 2022</p>

          <p>
            Please read this Privacy Policy ("Policy") carefully before using the Daybird website
            and app (the "Service") operated by Bridge to the Future LLC ("Daybird", "us", "we", or
            "our").
          </p>

          <p>
            This page is used to inform website visitors regarding our policies with the collection,
            use, and disclosure of Personal Information for anyone using to use our Service.
          </p>

          <p>
            If you choose to use our Service, then you agree to the collection and use of
            information in relation with this policy. The Personal Information that we collect is
            used for providing and improving the Service. We will not use or share your information
            with anyone except as described in this Privacy Policy.
          </p>

          <p>
            The terms used in this Privacy Policy have the same meanings as in our{' '}
            <a href={paths.TERMS}>Terms and Conditions</a>, unless otherwise defined in this Privacy
            Policy.
          </p>

          <h2>Information Collection and Use</h2>

          <p>
            For a better experience while using our Service, we may require you to provide us with
            certain personally identifiable information, including but not limited to your name and
            email address. The information that we collect will be used to contact you with updates
            to our service. You can change your email address or unsubscribe to these emails at any
            time.
          </p>

          <p>
            In addition, whenever you visit our Service, we collect information that your browser
            sends to us that is called Log Data. This Log Data may include information such as your
            computer’s Internet Protocol (“IP”) address, browser version, pages of our Service that
            you visit, the time and date of your visit, the time spent on those pages, and other
            statistics. When you access the Service using a mobile device, we may collect additional
            device information, such as the type of device you are using, its operating system, and
            mobile network information.
          </p>

          <h2>Cookies</h2>

          <p>
            Cookies are files with small amount of data that is commonly used an anonymous unique
            identifier. These are sent to your browser from the website that you visit and are
            stored on your computer’s hard drive.
          </p>

          <p>
            Our website may use these “cookies” to keep you signed in to our Service. You have the
            option to either accept or refuse these cookies by changing your browser settings. If
            you choose to refuse our cookies, you will not stay signed in once you close your
            browser tab or window.
          </p>

          <h2>Where we store your data</h2>

          <p>
            Daybird transfers, processes and stores data about you on servers operated by our
            hosting provider located in the United States of America. Your Personal Information may
            therefore be transferred to, processed and stored in a country different from your
            country of residence, and be subject to privacy laws that are different from those in
            your country of residence. Information collected within the European Economic Area
            (“EEA”) and Switzerland may, for example, be transferred to and processed by third
            parties referred to below that are located in a country outside of the EEA and
            Switzerland, where you may have fewer rights in relation to your Personal Information.
            By using the Service and providing us with your Personal Information, you are consenting
            to the transfer, processing and storage of your Personal Information in countries
            outside of your country of residence.
          </p>

          <h2>Security</h2>

          <p>
            We value your trust in providing us your Personal Information, thus we strive to use all
            commercially acceptable means of protecting it. However, no method of transmission over
            the internet, or method of electronic storage is 100% secure and reliable, and we cannot
            guarantee its absolute security. We encourage you to use precautions such as two-factor
            authentication for any account or service that stores sensitive information.
          </p>

          <h2>Links to Other Sites</h2>

          <p>
            Our Service may contain links to other sites. If you click on a third-party link, you
            will be directed to that site. Note that these external sites are not operated by us.
            Therefore, we strongly advise you to review the Privacy Policy of these websites. We
            have no control over, and assume no responsibility for the content, privacy policies, or
            practices of any third-party sites or services.
          </p>

          <h2>How we use your data</h2>

          <p>
            We reserve the right to communicate your Personal Information to third parties to make a
            legally-compliant request for the disclosure of Personal Information.
          </p>

          <p>
            In order to carry out certain business functions, such as alert notifications, trade
            fulfillment, transaction importing, or e-mail delivery, we may hire other companies to
            perform services on our behalf. We may disclose Personal Information that we collect
            about you to these companies to enable them to perform these services. However, these
            companies are obligated not to disclose or use the information for any other purpose.
          </p>

          <p>
            In addition, it is possible that in the future another company may acquire Daybird or
            its assets or that Daybird may partner with or purchase another company to continue to
            do business as a combined entity. In the event that any such transaction occurs, it is
            possible that our customer information, including your Personal Information, may be
            transferred to the new business entity as one of Daybird's assets. In such an event, we
            will update this policy to reflect any change in ownership or control of your Personal
            Information.
          </p>

          <h2>Children’s Privacy</h2>

          <p>
            Our Services do not address anyone under the age of 13. We do not knowingly collect
            personal identifiable information from children under 13. In the case we discover that a
            child under 13 has provided us with personal information, we immediately delete this
            from our servers. If you are a parent or guardian and you are aware that your child has
            provided us with personal information, please contact us so that we will be able to do
            necessary actions.
          </p>

          <h2>Changes to This Privacy Policy</h2>

          <p>
            We may update our Privacy Policy from time to time. Thus, we advise you to review this
            page periodically for any changes. We will notify you of any changes by posting the new
            Privacy Policy on this page. These changes are effective immediately, after they are
            posted on this page.
          </p>

          <h2>CAN SPAM Act</h2>

          <p>
            The CAN-SPAM Act is a law that sets the rules for commercial email, establishes
            requirements for commercial messages, gives recipients the right to have emails stopped
            from being sent to them, and spells out tough penalties for violations.
          </p>

          <p>
            We collect your email address in order to send information about our service and respond
            to inquiries and requests. You can unsubscribe at any time using a link at the bottom of
            those emails.
          </p>

          <h2>California Privacy Rights</h2>

          <p>
            California law gives residents of California the right under certain circumstances to
            request information from us regarding the manner in which we share certain categories of
            personal information (as defined by applicable California law) with third parties for
            their direct marketing purposes.
          </p>

          <h2>Contact Us</h2>

          <p>If you have any questions about this Policy, please contact us.</p>

          <p>You can also reach us at our mailing address:</p>

          <p>
            Bridge to the Future LLC
            <br />
            650 Castro St Suite 120-267
            <br />
            Mountain View, California 94041
            <br />
            United States
            <br />
          </p>
        </div>
      </div>
    </LandingLayout>
  )
}
